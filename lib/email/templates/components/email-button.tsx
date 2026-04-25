import * as React from "react";
import { Button } from "@react-email/components";

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

const baseStyle = {
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const variants = {
  primary: {
    ...baseStyle,
    backgroundColor: "#7c3aed",
    color: "#ffffff",
  },
  secondary: {
    ...baseStyle,
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  danger: {
    ...baseStyle,
    backgroundColor: "#dc2626",
    color: "#ffffff",
  },
};

export function EmailButton({
  href,
  children,
  variant = "primary",
}: EmailButtonProps): React.ReactElement {
  return (
    <Button href={href} style={variants[variant]}>
      {children}
    </Button>
  );
}
