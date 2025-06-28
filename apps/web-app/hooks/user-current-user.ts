import { useConfigStore } from "@/apps/web-app/pages/settings/store"

export const useCurrentUser = () => {
  const { profile } = useConfigStore()
  return {
    id: profile.userId,
    name: profile.username,
  }
}
