import { useEmbedding } from "@/hooks/use-embedding"
import { useSqlite } from "@/hooks/use-sqlite"

type ProgressCallback = (progress: { processed: number; total: number; percentage: number }) => void

export const usePreview = () => {
    const { sqlite } = useSqlite()

    const { embeddingTexts } = useEmbedding()

    const getEmbeddingStats = async (tableId: string, fieldId: string) => {
        if (!sqlite) {
            return
        }
        console.log("getEmbeddingStats", tableId, fieldId)
        return await sqlite?.getEmbeddingStats(tableId, fieldId)
    }

    const process = async (
        tableId: string,
        viewId: string,
        fieldId: string,
        onProgress?: ProgressCallback
    ) => {
        if (!sqlite) {
            return
        }
        const batchSize = 10
        let processed = 0 // Count of successfully processed items in this run
        let stillProcessing = true // Loop control flag

        const vectorMetaColumnName = `${fieldId}__vec_meta`

        // Base query to find items needing processing
        const rawQueryBase = `SELECT * FROM tb_${tableId} WHERE ${fieldId} IS NOT NULL AND (${vectorMetaColumnName} IS NULL OR json_extract(${vectorMetaColumnName}, '$.outOfDate') = 1)`

        // Get the initial total count of items to process (for percentage calculation)
        const countQuery = `SELECT COUNT(*) FROM (${rawQueryBase})`
        const countResult = await sqlite?.table(tableId).rows.query({}, {
            raw: true,
            rawQuery: countQuery
        })
        const total = countResult?.[0]?.['COUNT(*)'] || 0
        console.log("Initial total to process:", total)
        if (total === 0) {
            onProgress?.({ processed: 0, total: 0, percentage: 100 }) // Already done
            return;
        }

        // Initial progress report
        onProgress?.({ processed: 0, total, percentage: 0 })

        while (stillProcessing) {
            let batchDataLength = 0; // Track successfully processed items in this specific batch
            try {
                // --- KEY CHANGE: Query next batch directly without offset ---
                const query = `${rawQueryBase} LIMIT ${batchSize}`
                console.log("Querying next batch:", query)

                const rows = await sqlite?.table(tableId).rows.query({}, {
                    raw: true,
                    rawQuery: query
                })

                // --- KEY CHANGE: If no rows are returned, we are done ---
                if (!rows || rows.length === 0) {
                    stillProcessing = false
                    break // Exit the while loop
                }

                const texts = rows.map((row) => row[fieldId])
                let batchEmbeddings: (number[] | null)[] | null = null

                if (texts.length > 0) {
                    try {
                        batchEmbeddings = await embeddingTexts(texts) ?? null
                    } catch (embeddingError) {
                        console.error(`Embedding generation failed for a batch. Error:`, embeddingError, "Rows:", rows.map(r => r._id));
                        // Decide how to handle embedding errors. Option: Mark as failed? Skip for now?
                        // For now, we will skip this batch and let the loop try again later (or fail persistently)
                        // We *don't* set stillProcessing = false, allowing the loop to potentially retry or pick up other tasks
                        continue; // Skip to the next iteration of the while loop
                    }

                    if (!batchEmbeddings || batchEmbeddings.length !== texts.length) {
                        console.error(`Embedding returned incomplete results. Expected ${texts.length}, got ${batchEmbeddings?.length}. Skipping batch.`, "Rows:", rows.map(r => r._id));
                        // Skip this batch
                        continue;
                    }

                    if (batchEmbeddings) {
                        const batchData = rows.map((row, index) => {
                            const embedding = batchEmbeddings?.[index]
                            if (!embedding) {
                                console.warn(`Missing embedding for record ${row._id} at index ${index}. Skipping this record.`)
                                return null
                            }
                            return {
                                recordId: row._id as string,
                                value: JSON.stringify(embedding),
                                dimension: embedding.length
                            }
                        }).filter((item): item is { recordId: string; value: string; dimension: number } => item !== null)

                        console.log(`Processing batch of size ${rows.length}`, {
                            validEmbeddingsCount: batchData.length
                        })

                        if (batchData.length > 0) {
                            await sqlite?.updateEmbedding(tableId, fieldId, batchData)
                            // Increment processed count *only* after successful update
                            batchDataLength = batchData.length; // Store how many were successful in this batch
                            processed += batchDataLength;
                        } else {
                            console.warn(`No valid embeddings generated or records to update for this batch.`)
                            // Even if batchData is empty (e.g., all embeddings failed), we need to continue the loop
                            // to check if other records exist. The rows were fetched, so the loop should continue.
                        }
                    }
                }
            } catch (dbError) {
                console.error(`Error during database update for a batch:`, dbError)
                // Decide how to handle DB errors. Log and continue?
                // We continue the loop, hoping the issue was temporary or affects other batches differently.
                // The failed batch might be picked up again in the next iteration if the update didn't mark them.
            } finally {
                // Report progress after each batch attempt
                const percentage = total > 0 ? Math.round((processed / total) * 100) : (processed > 0 ? 100 : 0) // Use initial total for percentage
                console.log("Progress:", { processed, total, percentage });
                onProgress?.({ processed, total, percentage })

                // If the last query returned fewer rows than batchSize, it implies we might be done after this.
                // The !rows || rows.length === 0 check at the start of the loop is the definitive exit condition.
            }
        }

        // Final progress report upon completion
        console.log("Processing finished.");
        onProgress?.({ processed, total, percentage: 100 }) // Ensure 100% on completion
    }

    const queryEmbedding = async (tableId: string, fieldId: string, query: string) => {
        if (!sqlite) {
            return
        }
        const queryVector = await embeddingTexts([query]) || []
        const result = await sqlite?.queryEmbedding(tableId, fieldId, JSON.stringify(queryVector[0]))
        return result
    }
    return {
        process,
        queryEmbedding,
        getEmbeddingStats
    }
}