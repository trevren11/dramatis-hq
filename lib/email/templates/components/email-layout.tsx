import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Hr,
  Text,
  Link,
  Img,
} from "@react-email/components";

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  showFooter?: boolean;
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
};

const header = {
  padding: "24px 48px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  width: "150px",
  height: "auto",
};

const content = {
  padding: "0 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 48px",
};

const footerLink = {
  color: "#8898aa",
  textDecoration: "underline",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
  showFooter = true,
}: EmailLayoutProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://dramatishq.com/logo.png" alt="Dramatis HQ" style={logo} />
          </Section>

          <Section style={content}>{children}</Section>

          {showFooter && (
            <>
              <Hr style={divider} />
              <Section style={footer}>
                <Text>
                  Dramatis HQ - Theater Production Management
                  <br />
                  Making theater production easier for everyone.
                </Text>
                {unsubscribeUrl && (
                  <Text>
                    <Link href={unsubscribeUrl} style={footerLink}>
                      Unsubscribe
                    </Link>
                    {" | "}
                    <Link href="https://dramatishq.com/preferences" style={footerLink}>
                      Email Preferences
                    </Link>
                  </Text>
                )}
                <Text style={{ color: "#b4becc" }}>
                  &copy; {new Date().getFullYear()} Dramatis HQ. All rights reserved.
                </Text>
              </Section>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}
