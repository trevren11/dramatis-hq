"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode, Copy, Check } from "lucide-react";

interface Props {
  username: string;
  baseUrl?: string;
}

export function QRCodeGenerator({ username, baseUrl }: Props): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileUrl = `${baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://dramatis.app"}/talent/${username}`;

  const handleCopyUrl = async (): Promise<void> => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout((): void => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadPNG = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/profile/qr?format=png&size=500`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${username}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PNG:", error);
    }
  };

  const handleDownloadSVG = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/profile/qr?format=svg`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${username}-qr-code.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download SVG:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="mr-2 h-5 w-5" />
          Profile QR Code
        </CardTitle>
        <CardDescription>Share your profile with a scannable QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div ref={qrRef} className="rounded-lg bg-white p-4 shadow-inner">
            <QRCodeSVG value={profileUrl} size={200} level="H" marginSize={0} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <code className="bg-muted rounded px-2 py-1 text-sm">/talent/{username}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={(): void => {
                void handleCopyUrl();
              }}
              className="h-8 w-8 p-0"
            >
              {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(): void => {
                void handleDownloadPNG();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(): void => {
                void handleDownloadSVG();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              SVG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
