import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Dramatis-HQ account",
};

export default function SignupPage(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Your Account</CardTitle>
        <CardDescription>Choose how you want to join Dramatis-HQ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/signup/talent" className="block">
          <Button variant="outline" className="h-auto w-full flex-col items-start p-4">
            <span className="font-semibold">Join as Talent</span>
            <span className="text-muted-foreground text-sm">
              Create a profile, showcase your work, and find opportunities
            </span>
          </Button>
        </Link>
        <Link href="/signup/producer" className="block">
          <Button variant="outline" className="h-auto w-full flex-col items-start p-4">
            <span className="font-semibold">Join as Producer</span>
            <span className="text-muted-foreground text-sm">
              Manage auditions, casting, and productions
            </span>
          </Button>
        </Link>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
