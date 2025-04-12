import path from 'path';
import { app } from 'electron';

export function getResourcePath(relativePath: string): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, relativePath);
    } else {
        return path.join(app.getAppPath(), relativePath);
    }
}