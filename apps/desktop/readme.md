- The desktop client is built using Electron.
- The desktop app depends on the web-app; the web-app's code will be compatible with the desktop environment.
- `apps/desktop/renderer` and `apps/web-app/` share the same file structure. When you need to write logic specific to the desktop environment,
  please write it in `apps/desktop/renderer`. For instance, `/settings/storage` behaves entirely differently in the web-app compared to the desktop. In such cases, there's no need to write compatibility code in the web-app. Instead, directly implement the desktop-specific logic by overriding it in the desktop app.
