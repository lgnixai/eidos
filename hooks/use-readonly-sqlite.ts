
import { DataSpace } from '@/worker/web-worker/DataSpace';
import { create } from 'zustand';

interface SqliteStore {
    readonlySqlite: DataSpace | undefined;
    setReadSqliteProxy: (proxy: DataSpace) => void;
}

export const useReadSqliteStore = create<SqliteStore>((set) => ({
    readonlySqlite: undefined,
    setReadSqliteProxy: (proxy) => set({ readonlySqlite: proxy }),
}));

export const useReadonlySqlite = () => {
    const { readonlySqlite } = useReadSqliteStore();
    return readonlySqlite;
}