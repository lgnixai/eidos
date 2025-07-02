var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
const Breadcrumb = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ React.createElement("nav", { ref, "aria-label": "breadcrumb", ...props }));
Breadcrumb.displayName = "Breadcrumb";
const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement(
  "ol",
  {
    ref,
    className: cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    ),
    ...props
  }
));
BreadcrumbList.displayName = "BreadcrumbList";
const BreadcrumbItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement(
  "li",
  {
    ref,
    className: cn("inline-flex items-center gap-1.5", className),
    ...props
  }
));
BreadcrumbItem.displayName = "BreadcrumbItem";
const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? SlotPrimitive.Slot : "a";
  return /* @__PURE__ */ React.createElement(
    Comp,
    {
      ref,
      className: cn("transition-colors hover:text-foreground", className),
      ...props
    }
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";
const BreadcrumbPage = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement(
  "span",
  {
    ref,
    role: "link",
    "aria-disabled": "true",
    "aria-current": "page",
    className: cn("font-normal text-foreground", className),
    ...props
  }
));
BreadcrumbPage.displayName = "BreadcrumbPage";
const BreadcrumbSeparator = /* @__PURE__ */ __name(({
  children,
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  "li",
  {
    role: "presentation",
    "aria-hidden": "true",
    className: cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className),
    ...props
  },
  children ?? /* @__PURE__ */ React.createElement(ChevronRightIcon, null)
), "BreadcrumbSeparator");
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
const BreadcrumbEllipsis = /* @__PURE__ */ __name(({
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  "span",
  {
    role: "presentation",
    "aria-hidden": "true",
    className: cn("flex h-9 w-9 items-center justify-center", className),
    ...props
  },
  /* @__PURE__ */ React.createElement(DotsHorizontalIcon, { className: "h-4 w-4" }),
  /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "More")
), "BreadcrumbEllipsis");
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
};
