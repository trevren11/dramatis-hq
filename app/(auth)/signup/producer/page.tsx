import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign Up as Producer",
  description: "Create your Dramatis-HQ producer account",
};

export default function ProducerSignupPage(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <SignupForm
          userType="producer"
          title="Join as Producer"
          description="Manage auditions, casting, and productions all in one place"
        />
      </CardContent>
    </Card>
  );
}
