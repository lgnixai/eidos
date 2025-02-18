This directory contains the shadcn/ui component library

- Do not add non-shadcn/ui components to this directory. If you need to add components, please add them directly under the `components` directory. This helps with future component upgrades.
- Please maintain a changelog for any modifications to components to facilitate migration during future shadcn/ui upgrades.

## Changelogs

### DropdownMenuContent

Added a container property to specify the container for `DropdownMenuContent`. By default, it mounts to document.body.

```diff
 const DropdownMenuContent = React.forwardRef<
   React.ElementRef<typeof DropdownMenuPrimitive.Content>,
-  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
->(({ className, sideOffset = 4, ...props }, ref) => (
-  <DropdownMenuPrimitive.Portal>
+  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
+    container?: HTMLElement
+  }
+>(({ className, sideOffset = 4, container, ...props }, ref) => (
+  <DropdownMenuPrimitive.Portal
+    {...(container ? { container: container } : {})}
+  >
     <DropdownMenuPrimitive.Content
       ref={ref}
       sideOffset={sideOffset}
```
