import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign Up as Talent",
  description: "Create your Dramatis-HQ talent account",
};

export default function TalentSignupPage(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <SignupForm
          userType="talent"
          title="Join as Talent"
          description="Create a profile, showcase your work, and discover opportunities"
        />
      </CardContent>
    </Card>
  );
}
