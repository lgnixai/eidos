var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
const Pagination = /* @__PURE__ */ __name(({ className, ...props }) => /* @__PURE__ */ React.createElement(
  "nav",
  {
    role: "navigation",
    "aria-label": "pagination",
    className: cn("mx-auto flex w-full justify-center", className),
    ...props
  }
), "Pagination");
Pagination.displayName = "Pagination";
const PaginationContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement(
  "ul",
  {
    ref,
    className: cn("flex flex-row items-center gap-1", className),
    ...props
  }
));
PaginationContent.displayName = "PaginationContent";
const PaginationItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement("li", { ref, className: cn("", className), ...props }));
PaginationItem.displayName = "PaginationItem";
const PaginationLink = /* @__PURE__ */ __name(({
  className,
  isActive,
  size = "icon",
  ...props
}) => /* @__PURE__ */ React.createElement(
  "a",
  {
    "aria-current": isActive ? "page" : void 0,
    className: cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size
      }),
      className
    ),
    ...props
  }
), "PaginationLink");
PaginationLink.displayName = "PaginationLink";
const PaginationPrevious = /* @__PURE__ */ __name(({
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  PaginationLink,
  {
    "aria-label": "Go to previous page",
    size: "default",
    className: cn("gap-1 pl-2.5", className),
    ...props
  },
  /* @__PURE__ */ React.createElement(ChevronLeftIcon, { className: "h-4 w-4" }),
  /* @__PURE__ */ React.createElement("span", null, "Previous")
), "PaginationPrevious");
PaginationPrevious.displayName = "PaginationPrevious";
const PaginationNext = /* @__PURE__ */ __name(({
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  PaginationLink,
  {
    "aria-label": "Go to next page",
    size: "default",
    className: cn("gap-1 pr-2.5", className),
    ...props
  },
  /* @__PURE__ */ React.createElement("span", null, "Next"),
  /* @__PURE__ */ React.createElement(ChevronRightIcon, { className: "h-4 w-4" })
), "PaginationNext");
PaginationNext.displayName = "PaginationNext";
const PaginationEllipsis = /* @__PURE__ */ __name(({
  className,
  ...props
}) => /* @__PURE__ */ React.createElement(
  "span",
  {
    "aria-hidden": true,
    className: cn("flex h-9 w-9 items-center justify-center", className),
    ...props
  },
  /* @__PURE__ */ React.createElement(DotsHorizontalIcon, { className: "h-4 w-4" }),
  /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "More pages")
), "PaginationEllipsis");
PaginationEllipsis.displayName = "PaginationEllipsis";
export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
};
