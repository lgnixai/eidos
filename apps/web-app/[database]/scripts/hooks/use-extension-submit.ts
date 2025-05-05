import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { IScript } from "@/worker/web-worker/meta-table/script";
import { getEditorLanguage } from "../helper";
import { useScript } from "./use-script";
import { EIDOS_SPACE_BASE_URL } from "@/lib/const";

interface UseExtensionSubmitProps {
    script: IScript;
    editorContent: string;
}

// Define input structure for publishing a new version, mirroring the backend
interface PublishNewVersionPayload {
    version?: string;
    code: string;
    changelog?: string;
    language?: string; // Optional, to allow language updates
}



export const useExtensionSubmit = ({ script, editorContent }: UseExtensionSubmitProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false); // Add state for publishing
    const { toast } = useToast();
    const { updateScript } = useScript();

    const submitExtension = useCallback(async () => {
        if (!script || !editorContent) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Missing script data or content.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const codeToSubmit = editorContent;
            const scriptLanguage = getEditorLanguage(script);

            const payload = {
                name: script.name || `Script ${script.id}`,
                version: "0.0.1", // Consider making this dynamic
                code: codeToSubmit,
                description: script.description || "",
                type: script.type,
                language: scriptLanguage,
                changelog: "Initial submission", // Consider making this dynamic
                initialStatus: "public",
                publishFirstVersion: true,
            };

            const response = await fetch(
                `${EIDOS_SPACE_BASE_URL}/api/extensions/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    credentials: 'include' // Include cookies for cross-origin requests
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || `HTTP error! status: ${response.status}`
                );
            }

            toast({
                title: "Extension Submitted Successfully",
                description: `Extension ID: ${result.extensionId}`,
            });

            await updateScript({
                ...script,
                marketplace_id: result.extensionId,
            });
        } catch (error: any) {
            console.error("Error submitting extension:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: error.message || "An unknown error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [script, editorContent, toast, updateScript]); // Added updateScript dependency

    const publishNewVersion = useCallback(async () => {
        if (!script?.marketplace_id) {
            toast({
                variant: "destructive",
                title: "Publish Failed",
                description: "Missing extension ID. Has the extension been submitted initially?",
            });
            return;
        }
        const payload = {
            code: editorContent,
            changelog: "Updated",
        }
        if (!payload.code) {
            toast({
                variant: "destructive",
                title: "Publish Failed",
                description: "Version and code are required.",
            });
            return;
        }

        setIsPublishing(true);
        try {
            const extensionId = script.marketplace_id;
            const apiPayload: PublishNewVersionPayload & { language?: string } = {
                ...payload,
                code: editorContent, // Ensure we are using the latest editor content for the code
            };


            const response = await fetch(
                // Use the endpoint structure implied by the backend code
                `${EIDOS_SPACE_BASE_URL}/api/extensions/${extensionId}/publishNewVersion`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(apiPayload),
                    credentials: 'include' // Include cookies for cross-origin requests
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || `HTTP error! status: ${response.status}`
                );
            }

            toast({
                title: "New Version Published Successfully",
                description: `Version ID: ${result.versionId}`,
            });

            // Potentially update local script state if needed, e.g., new version number
            // await updateScript({ ...script, version: payload.version }); // Example

        } catch (error: any) {
            console.error("Error publishing new version:", error);
            toast({
                variant: "destructive",
                title: "Publish Failed",
                description: error.message || "An unknown error occurred.",
            });
        } finally {
            setIsPublishing(false);
        }
    }, [script, editorContent, toast]); // Dependencies for the new function

    return {
        isSubmitting,
        submitExtension,
        isPublishing, // Expose the new state
        publishNewVersion, // Expose the new function
    };
}; 