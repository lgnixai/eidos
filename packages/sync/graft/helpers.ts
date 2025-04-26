import console from 'electron-log';

type ParsedSnapshot = {
    latestLsn: number;
    pageCount: number;
    primaryLsn: number; // LSN repeated in the second part
    marker: string; // The character marker (e.g., 'r')
    secondaryLsn: number; // The LSN after the marker
} | null; // Allow null if parsing fails

export type GraftStatus = {
    clientId: string;
    volumeId: string;
    currentSnapshot: ParsedSnapshot;
    currentSnapshotRaw: string; // Keep the original string
    autosync: boolean;
    volumeStatus: 'Ok' | string; // Allow other statuses
};

export function parseGraftStatus(statusString: string): GraftStatus {
    const lines = statusString.trim().split('\n');
    const resultJson: Partial<GraftStatus> = {}; // Use Partial for intermediate state

    if (lines.length > 0 && lines[0] !== 'Graft Status') {
        console.warn('First line is not "Graft Status":', lines[0]);
    }

    const startIndex = lines[0] === 'Graft Status' ? 1 : 0;

    // Regex to parse the snapshot string, e.g., "Snapshot[220;52][220r189]"
    const snapshotRegex = /^Snapshot\[(\d+);(\d+)\]\[(\d+)([a-zA-Z])(\d+)\]$/;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            console.warn('Skipping line without colon:', line);
            continue;
        }

        const keyRaw = line.substring(0, separatorIndex).trim();
        const valueRaw = line.substring(separatorIndex + 1).trim();

        switch (keyRaw) {
            case 'Client ID':
                resultJson.clientId = valueRaw;
                break;
            case 'Volume ID':
                resultJson.volumeId = valueRaw;
                break;
            case 'Current snapshot':
                resultJson.currentSnapshotRaw = valueRaw; // Store raw string
                const match = valueRaw.match(snapshotRegex);
                if (match) {
                    resultJson.currentSnapshot = {
                        latestLsn: parseInt(match[1], 10),
                        pageCount: parseInt(match[2], 10),
                        primaryLsn: parseInt(match[3], 10),
                        marker: match[4],
                        secondaryLsn: parseInt(match[5], 10),
                    };
                } else {
                    console.warn('Failed to parse Current snapshot string:', valueRaw);
                    resultJson.currentSnapshot = null; // Set to null if format is unexpected
                }
                break;
            case 'Autosync':
                resultJson.autosync = valueRaw.toLowerCase() === 'true';
                break;
            case 'Volume status':
                resultJson.volumeStatus = valueRaw as GraftStatus['volumeStatus'];
                break;
            default:
                // Handle unknown keys - maybe convert to camelCase and add?
                let keyCamelCase = keyRaw.replace(/\s(.)/g, (_match, group1) => group1.toUpperCase()).replace(/\s/g, '');
                keyCamelCase = keyCamelCase.charAt(0).toLowerCase() + keyCamelCase.slice(1);
                console.warn('Unknown graft_status key:', keyRaw, 'Storing as is with camelCase key:', keyCamelCase);
                (resultJson as any)[keyCamelCase] = valueRaw; // Store unknown keys dynamically
        }
    }

    // Add checks for required fields before casting
    if (resultJson.clientId === undefined ||
        resultJson.volumeId === undefined ||
        resultJson.currentSnapshotRaw === undefined || // Check raw string presence
        resultJson.currentSnapshot === undefined || // Check ParsedSnapshot presence (even if null)
        resultJson.autosync === undefined ||
        resultJson.volumeStatus === undefined) {
        console.error('Failed to parse GraftStatus completely, missing fields:', resultJson);
        // Decide how to handle incomplete data, maybe throw an error or return a default/error state
        // For now, we'll still attempt the cast but it might be inaccurate
        return resultJson as GraftStatus; // This cast might be unsafe if fields are missing
    }


    return resultJson as GraftStatus;
}


type PageStatus = {
    pageno: number;
    lsn: number;
    state: 'cached' | 'pending' | string; // Keep string for potential future states
};

export function parsePagesStatus(pagesString: string): PageStatus[] {
    const lines = pagesString.trim().split('\n');
    const result: PageStatus[] = [];

    if (lines.length === 0) {
        return result;
    }

    // Expecting header: 'pageno   | lsn    | state'
    const header = lines[0].trim();
    if (!header.startsWith('pageno') || !header.includes('| lsn') || !header.includes('| state')) {
        console.warn('Unexpected pages header format:', header);
        // Attempt to parse anyway if header is missing or malformed, starting from index 0
    }

    // Start from index 1 if the header seems correct, otherwise start from 0
    const startIndex = (header.startsWith('pageno') && header.includes('| lsn') && header.includes('| state')) ? 1 : 0;


    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('|');

        if (parts.length !== 3) {
            console.warn('Skipping malformed pages line:', line);
            continue;
        }

        const pagenoStr = parts[0].trim();
        const lsnStr = parts[1].trim();
        const stateStr = parts[2].trim();

        const pageno = parseInt(pagenoStr, 10);
        const lsn = parseInt(lsnStr, 10);

        if (isNaN(pageno) || isNaN(lsn)) {
            console.warn('Failed to parse numbers from pages line:', line);
            continue;
        }

        result.push({
            pageno: pageno,
            lsn: lsn,
            state: stateStr as PageStatus['state'], // Assume state is valid for now
        });
    }

    return result;
} 