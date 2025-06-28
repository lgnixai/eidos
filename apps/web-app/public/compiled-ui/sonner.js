import React from 'react';

"use client";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
const Toaster = /* @__PURE__ */ __name(({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ React.createElement(
    Sonner,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
}, "Toaster");
export { Toaster };
