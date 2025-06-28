import React from 'react';

"use client";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
const ResizablePanelGroup = /* @__PURE__ */ __name(({
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  ResizablePrimitive.PanelGroup,
  {
    className: cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    ),
    ...props
  }
), "ResizablePanelGroup");
const ResizablePanel = ResizablePrimitive.Panel;
const ResizableHandle = /* @__PURE__ */ __name(({
  withHandle,
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  ResizablePrimitive.PanelResizeHandle,
  {
    className: cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    ),
    ...props
  },
  withHandle && /* @__PURE__ */ React.createElement("div", { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border" }, /* @__PURE__ */ React.createElement(DragHandleDots2Icon, { className: "h-2.5 w-2.5" }))
), "ResizableHandle");
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
