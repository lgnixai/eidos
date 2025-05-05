import { useIndexedDB } from "@/hooks/use-indexed-db";
import { IScript } from "@/worker/web-worker/meta-table/script";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useScript } from "../../../web-app/[database]/scripts/hooks/use-script";
import { EIDOS_SPACE_BASE_URL } from "@/lib/const";


export const useExtensionInstaller = () => {
    const navigate = useNavigate();
    const { addScript } = useScript();
    const [lastOpenedDatabase,] = useIndexedDB(
        "kv",
        "lastOpenedDatabase",
        ""
    );

    const installExtension = useCallback(async (extensionId: string) => {
        try {
            const response = await fetch(`${EIDOS_SPACE_BASE_URL}/api/extensions/${extensionId}/download`);
            if (!response.ok) {
                throw new Error(`Failed to fetch extension: ${response.statusText}`);
            }
            const extensionData = await response.json();

            // Map the API response to the IScript interface
            // Using the new nested structure with extension and latestVersion
            const script: IScript = {
                id: extensionData.extension.id, // Use the main extension ID
                name: extensionData.extension.name, // Use name from extension object
                type: extensionData.extension.type, // Assuming type is 'script', adjust if extensionData.extension.type is relevant
                description: extensionData.extension.description, // Use description from extension object
                version: extensionData.latestVersion.version, // Use version from latestVersion object
                ...(extensionData.extension.type === 'm_block' || extensionData.extension.type === 'script'
                    ? { ts_code: extensionData.latestVersion.code, code: '' }
                    : { code: extensionData.latestVersion.code }),
                enabled: true, // Assuming newly installed extensions should be enabled
                commands: [], // Placeholder: API response doesn't include commands
                // model, prompt_config, tables, envs, env_map, fields_map, bindings, dependencies can be added if available from API
            };

            await addScript(script);
            console.log(`Successfully installed extension: ${extensionId}`);
            // Optional: Navigate to a relevant page after install?
            if (lastOpenedDatabase) {
                navigate(`/${lastOpenedDatabase}/extensions/${script.id}`);
            }


        } catch (error) {
            console.error("Error handling extension protocol action:", error);
            // TODO: Show error to user?
        }
    }, [addScript, navigate, lastOpenedDatabase]);

    return { installExtension };
};
