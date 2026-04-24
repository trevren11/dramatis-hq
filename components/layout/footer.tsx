import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-tight">
                <span className="text-primary">Dramatis</span>
                <span className="text-secondary">HQ</span>
              </span>
            </Link>
            <p className="text-muted-foreground mt-2 text-sm">
              Connect talent with producers. Manage auditions, casting, and productions.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">For Talent</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/talent/auditions" className="hover:text-foreground transition-colors">
                  Browse Auditions
                </Link>
              </li>
              <li>
                <Link href="/talent/profile" className="hover:text-foreground transition-colors">
                  Your Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/talent/applications"
                  className="hover:text-foreground transition-colors"
                >
                  Applications
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">For Producers</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/producer/projects" className="hover:text-foreground transition-colors">
                  Your Projects
                </Link>
              </li>
              <li>
                <Link href="/producer/castings" className="hover:text-foreground transition-colors">
                  Manage Castings
                </Link>
              </li>
              <li>
                <Link href="/producer/talent" className="hover:text-foreground transition-colors">
                  Find Talent
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-8 border-t pt-6 text-center text-sm">
          &copy; {currentYear} Dramatis-HQ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
