import { ResumeBuilder } from "@/components/resume";
import { createSampleProfile } from "@/lib/resume";

export const metadata = {
  title: "Resume Builder",
  description: "Create and customize your professional theatrical resume",
};

export default function ResumeBuilderPage(): React.ReactElement {
  const profile = createSampleProfile();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground mt-2">
          Select which credits, training, and skills to include in your resume. Preview updates in
          real-time.
        </p>
      </div>

      <ResumeBuilder profile={profile} />
    </div>
  );
}
