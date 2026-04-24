"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            "border-input bg-background h-4 w-4 rounded border focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm leading-none font-medium">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
