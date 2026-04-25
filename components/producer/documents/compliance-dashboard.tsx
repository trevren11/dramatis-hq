"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DOCUMENT_TYPE_LABELS } from "@/lib/db/schema/documents";

interface ComplianceStatus {
  talentProfileId: string;
  talentName: string;
  talentEmail: string;
  documentType: string;
  year: number | null;
  status: "missing" | "pending" | "delivered" | "viewed" | "downloaded" | "overdue";
  deadline: string | null;
  documentId?: string;
  uploadedAt?: string;
  viewedAt?: string;
}

interface ComplianceSummary {
  total: number;
  missing: number;
  pending: number;
  viewed: number;
  downloaded: number;
  overdue: number;
}

interface ComplianceDashboardProps {
  statuses: ComplianceStatus[];
  summary: ComplianceSummary;
  isLoading?: boolean;
  showOptions?: Array<{ id: string; title: string }>;
  selectedShowId?: string;
  onShowChange?: (showId: string) => void;
  onUploadForTalent?: (talentProfileId: string, documentType: string) => void;
}

function getStatusBadge(status: ComplianceStatus["status"]): React.ReactElement {
  const config: Record<ComplianceStatus["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    missing: { label: "Missing", variant: "destructive" },
    pending: { label: "Pending", variant: "outline" },
    delivered: { label: "Delivered", variant: "secondary" },
    viewed: { label: "Viewed", variant: "default" },
    downloaded: { label: "Downloaded", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ComplianceDashboard({
  statuses,
  summary,
  isLoading = false,
  showOptions = [],
  selectedShowId,
  onShowChange,
  onUploadForTalent,
}: ComplianceDashboardProps): React.ReactElement {
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");

  const filteredStatuses = statuses.filter((s) => {
    if (filterType !== "all" && s.documentType !== filterType) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const completionRate =
    summary.total > 0
      ? Math.round(((summary.viewed + summary.downloaded) / summary.total) * 100)
      : 0;

  // Group statuses by talent for a cleaner view
  const groupedByTalent = filteredStatuses.reduce<Record<string, ComplianceStatus[]>>(
    (acc, status) => {
      const key = status.talentProfileId;
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(status);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-2xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Missing Documents</CardDescription>
            <CardTitle className="text-2xl text-red-600">{summary.missing}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Need to upload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{summary.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Awaiting talent action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">{summary.overdue}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {showOptions.length > 0 && (
          <Select value={selectedShowId ?? "all"} onValueChange={onShowChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Shows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {showOptions.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  {show.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Document Types</SelectItem>
            <SelectItem value="W2">W-2 Forms</SelectItem>
            <SelectItem value="1099">1099 Forms</SelectItem>
            <SelectItem value="I9">I-9 Forms</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compliance List */}
      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center">Loading compliance data...</div>
      ) : Object.keys(groupedByTalent).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No compliance records found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Cast members will appear here once they are confirmed for a show
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByTalent).map(([talentId, talentStatuses]) => {
            const firstStatus = talentStatuses[0]!;
            return (
              <Card key={talentId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{firstStatus.talentName}</CardTitle>
                  <CardDescription>{firstStatus.talentEmail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {talentStatuses.map((status, idx) => (
                      <div
                        key={`${talentId}-${status.documentType}-${idx}`}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {DOCUMENT_TYPE_LABELS[status.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                              {status.year && <span className="text-muted-foreground"> ({status.year})</span>}
                            </p>
                            {status.deadline && (
                              <p className="text-muted-foreground text-xs">
                                Deadline: {formatDate(status.deadline)}
                              </p>
                            )}
                            {status.viewedAt && (
                              <p className="text-xs text-green-600">
                                Viewed: {formatDate(status.viewedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status.status)}
                          {status.status === "missing" && onUploadForTalent && (
                            <Button
                              size="sm"
                              onClick={() => onUploadForTalent(status.talentProfileId, status.documentType)}
                            >
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
