// Types and sample data are safe to export (no @react-pdf/renderer dependency)
export * from "./types";
export { createSampleProfile } from "./sample";

// NOTE: Do NOT export from generator.tsx or templates/theatrical.tsx here
// as they import @react-pdf/renderer which conflicts with Next.js static page generation.
// Instead, use dynamic imports where needed:
//   const { generateResumePdf } = await import("@/lib/resume/generator");
//   const { TheatricalResume } = await import("@/lib/resume/templates/theatrical");
