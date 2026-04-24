"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";

export function DocumentsSection(): React.ReactElement {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = (): void => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload W-2s, contracts, call sheets, and other important documents.
            All files are encrypted for your security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>
            View and manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}
