import { GridColumn } from "@glideapps/glide-data-grid";
// Use a compatible type for size if the direct import fails
// import { type Size } from "ahooks/lib/useSize"; // Previous attempts failed
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useViewOperation } from "@/components/table/hooks";
import { IGridViewProperties, IView } from "@/lib/store/IView";

interface UseFreezeLineProps {
    currentView: IView<IGridViewProperties> | null | undefined;
    columns: readonly GridColumn[] | undefined;
    // Optional callback if the parent needs to persist the change
    // onFreezeColumnsChange?: (count: number) => void;
}

export const ROW_NUMBER_COL_WIDTH = 48; // Default width for row numbers
const HOVER_TARGET_WIDTH = 16; // Width of the hoverable/draggable area for the line

const FREEZE_LINE_OFFSET = HOVER_TARGET_WIDTH / 2 - 1; // Offset for the freeze line

export function useFreezeLine({
    currentView,
    columns,
}: // onFreezeColumnsChange,
    UseFreezeLineProps) {
    const freezeHandleRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false); // State to track hover
    const dragStartX = useRef<number>(0);
    const currentDragX = useRef<number | null>(null); // Store current mouse X during drag
    const { freezeColumn } = useViewOperation()

    // Determine initial freeze columns based on view properties or default
    const initialFreezeColumns = useMemo(() => {
        return currentView?.properties?.freezeColumns ?? 0;
    }, [currentView?.properties?.freezeColumns]);

    const [freezeColumns, setFreezeColumns] = useState(initialFreezeColumns);
    const [previewFreezeColumns, setPreviewFreezeColumns] = useState<number | null>(null); // Stores potential freeze index during drag

    // Update internal state if initial value changes (e.g., view loaded)
    useEffect(() => {
        setFreezeColumns(initialFreezeColumns);
    }, [initialFreezeColumns]);


    // Calculate column end positions (right edge relative to start)
    const columnEndPositions = useMemo(() => {
        if (!columns) return [];
        const positions = [ROW_NUMBER_COL_WIDTH]; // End of row numbers column
        let currentLeft = ROW_NUMBER_COL_WIDTH;
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            // Attempt to access width safely, provide default
            const colWidth = typeof (column as any)?.width === 'number' && (column as any).width > 0
                ? (column as any).width
                : 300; // Use 300 if width is not a positive number
            currentLeft += colWidth;
            positions.push(currentLeft);
        }
        return positions;
    }, [columns]);

    // Calculate the exact position where the *actual* freeze line should be visually
    const freezeLinePosition = useMemo(() => {
        if (freezeColumns <= 0 || !columns || freezeColumns > columns.length) {
            return ROW_NUMBER_COL_WIDTH + FREEZE_LINE_OFFSET;
        }
        return columnEndPositions[freezeColumns] + FREEZE_LINE_OFFSET;
    }, [columnEndPositions, freezeColumns, columns]);

    // Calculate the exact position where the *preview* freeze line should snap to
    const previewLinePosition = useMemo(() => {
        if (previewFreezeColumns === null || previewFreezeColumns < 0 || !columns || previewFreezeColumns > columns.length || !columnEndPositions || columnEndPositions.length === 0) {
            // No preview if state is null, index is invalid, or positions aren't calculated
            return null;
        }
        // The preview line should be at the end position corresponding to the
        // number of columns frozen. columnEndPositions[0] is after row numbers,
        // columnEndPositions[1] is after the first data column, etc.
        // So, index `previewFreezeColumns` gives the correct position.
        return columnEndPositions[previewFreezeColumns] ?? null; // Use null if index somehow out of bounds

    }, [columnEndPositions, previewFreezeColumns, columns]);


    // Adjust the visual left position of the handle element to center the hover/drag target
    const freezeHandleVisualLeft = useMemo(() => {
        return freezeLinePosition - HOVER_TARGET_WIDTH / 2;
    }, [freezeLinePosition]);


    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        setIsDragging(true);
        setPreviewFreezeColumns(freezeColumns); // Initialize preview with current value
        dragStartX.current = event.clientX;
        currentDragX.current = event.clientX; // Initialize current drag X
        // Prevent text selection and set cursor during drag
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
        event.preventDefault();
    }, [freezeColumns]); // Add freezeColumns dependency

    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            // Ensure columns and positions are available, and dragging is active
            if (!isDragging || !columns || !columnEndPositions || columnEndPositions.length <= 1) return; // Need at least row num pos + 1 col pos

            const currentX = event.clientX;
            currentDragX.current = currentX; // Update current mouse position
            // Assuming grid starts at offset 0 for simplicity. Adjust if needed.
            const targetLinePosition = currentX;

            let newPreviewFreezeColumns = 0; // Default to freezing 0 columns

            // Iterate through the columns to find where the target position falls relative to midpoints
            let found = false;
            for (let k = 0; k < columns.length; k++) {
                // colStartPos is the end position of the previous element (col k-1 or row num)
                const colStartPos = columnEndPositions[k];
                // colEndPos is the end position of the current column k
                const colEndPos = columnEndPositions[k + 1];
                // Calculate the midpoint of the current column k
                const midPoint = colStartPos + Math.max(0, colEndPos - colStartPos) / 2;

                // If the target position is before the midpoint of column k,
                // it means the user intends to freeze k columns.
                if (targetLinePosition < midPoint) {
                    newPreviewFreezeColumns = k;
                    found = true;
                    break; // Found the correct count, exit loop
                }
            }

            // If the loop completes without finding a midpoint before the target,
            // it means the target is beyond the midpoint of the last column.
            if (!found) {
                newPreviewFreezeColumns = columns.length; // Freeze all columns
            }

            // Clamp the value to ensure it's within [0, columns.length] bounds
            // (Should be guaranteed by logic above, but added for safety)
            newPreviewFreezeColumns = Math.max(0, Math.min(newPreviewFreezeColumns, columns.length));

            // Update preview state only if it has actually changed
            if (newPreviewFreezeColumns !== previewFreezeColumns) {
                setPreviewFreezeColumns(newPreviewFreezeColumns);
            }
        },
        [isDragging, columns, columnEndPositions, previewFreezeColumns] // Dependencies
    );

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            // Apply the previewed freeze column count if it's valid and different
            if (previewFreezeColumns !== null && previewFreezeColumns !== freezeColumns) {
                // `previewFreezeColumns` now directly represents the target number of frozen columns
                const newFreezeColumns = previewFreezeColumns;
                setFreezeColumns(newFreezeColumns);
                // Call the operation to persist the change
                freezeColumn(currentView?.id ?? "", newFreezeColumns);
            }

            // Reset dragging states
            setIsDragging(false);
            setPreviewFreezeColumns(null); // Clear preview state
            dragStartX.current = 0;
            currentDragX.current = null;

            // Reset body cursor and selection styles
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            // Re-check hover state via handleMouseLeave implicitly or explicitly if needed
        }
    }, [isDragging, previewFreezeColumns, freezeColumns, currentView?.id, freezeColumn]); // Added dependencies

    // Add/remove global listeners for mouse move and up during drag
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }

        return () => {
            // Cleanup listeners
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            // Ensure body styles are reset if component unmounts while dragging
            if (isDragging) { // Only reset if it was dragging on unmount
                if (document.body.style.userSelect === "none") {
                    document.body.style.userSelect = "";
                }
                if (document.body.style.cursor === "col-resize") {
                    document.body.style.cursor = "";
                }
            }
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Handlers for hover state on the handle element
    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        // Don't hide if currently dragging, wait for mouseup/mouseleave
        if (!isDragging) {
            setIsHovering(false);
        }
    }, [isDragging]); // Re-evaluate when dragging state changes

    return {
        freezeHandleRef,
        freezeHandleLeft: freezeHandleVisualLeft, // Position of the draggable handle
        freezeColumns, // The actual number of frozen columns
        handleMouseDown,
        isDragging,
        isHovering,
        handleMouseEnter,
        handleMouseLeave,
        HOVER_TARGET_WIDTH,
        previewFreezeColumns, // The potential freeze index during drag
        previewLinePosition, // The calculated visual position for the preview line
        // currentDragX: currentDragX.current, // Optionally return raw mouse X for a direct feedback line
    };
} 