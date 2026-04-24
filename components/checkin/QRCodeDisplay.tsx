/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-misused-promises, @typescript-eslint/no-deprecated */
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, Copy, Check, Printer } from "lucide-react";

interface QRCodeDisplayProps {
  checkinUrl: string;
  auditionTitle: string;
  className?: string;
}

/**
 * QR code display component for audition check-in
 */
export function QRCodeDisplay({ checkinUrl, auditionTitle, className }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${auditionTitle.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      downloadLink.href = pngUrl;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${auditionTitle}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }
            p {
              color: #666;
              margin-bottom: 32px;
            }
            .qr-container {
              padding: 24px;
              border: 2px solid #eee;
              border-radius: 12px;
            }
            .url {
              margin-top: 24px;
              font-size: 12px;
              color: #999;
              word-break: break-all;
              max-width: 300px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>${auditionTitle}</h1>
          <p>Scan to check in</p>
          <div class="qr-container">
            ${svgData}
          </div>
          <p class="url">${checkinUrl}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="text-center">
        <CardTitle>Check-in QR Code</CardTitle>
        <CardDescription>
          Display this QR code at your audition venue for talent to scan and check in
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="rounded-lg border bg-white p-4">
          <QRCodeSVG
            id="qr-code-svg"
            value={checkinUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">{auditionTitle}</p>
          <p className="text-muted-foreground mt-1 max-w-[250px] truncate text-xs">{checkinUrl}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
