import { create } from "zustand"
import { persist } from "zustand/middleware"

import { uuidv7 } from "@/lib/utils"
import { BackupServerFormValues } from "@/apps/web-app/settings/backup/page"

import { ProfileFormValues } from "./general/profile-form"

export interface ApiKey {
  id: string;
  name: string;
  value: string;
  createdAt: string; // Optional: for sorting or display
}

interface ConfigState {
  profile: ProfileFormValues
  setProfile: (profile: ProfileFormValues) => void

  backupServer: BackupServerFormValues
  setBackupServer: (backupServer: BackupServerFormValues) => void

  extensionsManagerKey: string | undefined
  setExtensionsManagerKey: (key: string | undefined) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      profile: {
        username: "",
        userId: uuidv7(),
      },
      backupServer: {
        Github__repo: "",
        Github__token: "",
        Github__enabled: false,
        S3__endpointUrl: "",
        S3__accessKeyId: "",
        S3__secretAccessKey: "",
        autoSaveGap: 360,
      },
      extensionsManagerKey: undefined,
      setProfile: (profile) =>
        set((state) => {
          if (!state.profile.userId) {
            profile.userId = uuidv7()
          }
          return { ...state, profile }
        }),
      setBackupServer: (backupServer) => set({ backupServer }),
      setExtensionsManagerKey: (key) => set({ extensionsManagerKey: key }),
    }),
    {
      name: "settings-config",
      getStorage: () => localStorage,
    }
  )
)
