import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ React.createElement(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props
  },
  /* @__PURE__ */ React.createElement(
    CheckboxPrimitive.Indicator,
    {
      className: cn("flex items-center justify-center text-current")
    },
    /* @__PURE__ */ React.createElement(CheckIcon, { className: "h-4 w-4" })
  )
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
