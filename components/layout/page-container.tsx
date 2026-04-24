import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps {
  className?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  className,
  children,
  maxWidth = "xl",
}: PageContainerProps): React.ReactElement {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-6", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  className?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  className,
  title,
  description,
  actions,
}: PageHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
