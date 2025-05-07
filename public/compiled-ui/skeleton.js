import React from 'react';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { cn } from "@/lib/utils";
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-primary/10", className),
      ...props
    }
  );
}
__name(Skeleton, "Skeleton");
export { Skeleton };
