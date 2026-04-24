"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input type="checkbox" id={inputId} ref={ref} className="peer sr-only" {...props} />
          <div
            className={cn(
              "border-input bg-background peer-focus-visible:ring-ring peer-checked:border-primary peer-checked:bg-primary flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          >
            <Check className="text-primary-foreground hidden h-3 w-3 peer-checked:block" />
          </div>
          <label
            htmlFor={inputId}
            className="absolute inset-0 cursor-pointer peer-disabled:cursor-not-allowed"
          />
        </div>
        {label && (
          <label
            htmlFor={inputId}
            className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
