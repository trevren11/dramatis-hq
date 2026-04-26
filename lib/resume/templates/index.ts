export { TheatricalResume } from "./theatrical";
export { ModernResume } from "./modern";
export { MinimalResume } from "./minimal";
export { CreativeResume } from "./creative";
export { CommercialResume } from "./commercial";

export type { ResumeTemplateProps, PhysicalAttributeOptions } from "./shared";
export {
  formatPhysicalAttributes,
  getPhysicalAttributeOptions,
  categorizeWorkHistory,
  capitalizeFirst,
} from "./shared";

import type { ResumeTemplate } from "../types";

export const TEMPLATE_INFO: Record<ResumeTemplate, { name: string; description: string }> = {
  theatrical: {
    name: "Theatrical",
    description: "Classic theatrical resume format with Times Roman font",
  },
  modern: {
    name: "Modern",
    description: "Clean, contemporary design with blue accents and skill tags",
  },
  minimal: {
    name: "Minimal",
    description: "Understated elegance with plenty of white space",
  },
  creative: {
    name: "Creative",
    description: "Bold header banner with two-column layout",
  },
  commercial: {
    name: "Commercial",
    description: "Professional table format ideal for commercial casting",
  },
};
