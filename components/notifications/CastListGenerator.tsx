"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface CastMember {
  roleId: string;
  roleName: string;
  roleType: string | null;
  sortOrder: number | null;
  talentId: string;
  talentName: string;
  stageName: string | null;
  status: string;
  email?: string;
  phone?: string;
  notificationStatus?: string;
  responseType?: string;
  slotIndex: number;
}

interface CastListSummary {
  total: number;
  confirmed: number;
  tentative: number;
  declined: number;
  draft: number;
  pending: number;
}

interface ShowInfo {
  id: string;
  title: string;
  venue: string | null;
  rehearsalStart: string | null;
  performanceStart: string | null;
  performanceEnd: string | null;
}

interface CastListGeneratorProps {
  showId: string;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_ICONS = {
  confirmed: CheckCircle,
  tentative: Clock,
  declined: XCircle,
  draft: AlertCircle,
};

const STATUS_COLORS = {
  confirmed: "text-green-600",
  tentative: "text-yellow-600",
  declined: "text-red-600",
  draft: "text-gray-500",
};

// eslint-disable-next-line complexity
export function CastListGenerator({
  showId,
  isOpen,
  onClose,
}: CastListGeneratorProps): React.ReactElement | null {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [castList, setCastList] = useState<CastMember[]>([]);
  const [summary, setSummary] = useState<CastListSummary | null>(null);

  const [includeContact, setIncludeContact] = useState(false);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [groupByRole, setGroupByRole] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const fetchCastList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/cast-list`);
      if (!response.ok) {
        throw new Error("Failed to fetch cast list");
      }
      const data = (await response.json()) as {
        show: ShowInfo;
        castList: CastMember[];
        summary: CastListSummary;
      };
      setShowInfo(data.show);
      setCastList(data.castList);
      setSummary(data.summary);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load cast list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showId, toast]);

  useEffect(() => {
    if (isOpen) {
      void fetchCastList();
    }
  }, [isOpen, fetchCastList]);

  const handleExport = useCallback(
    async (format: "pdf" | "csv") => {
      setIsExporting(true);
      try {
        const response = await fetch(`/api/shows/${showId}/cast-list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            includeContact,
            includeStatus,
            groupByRole,
            filterStatus: filterStatus.length > 0 ? filterStatus : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to export cast list");
        }

        if (format === "csv") {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${showInfo?.title.replace(/[^a-z0-9]/gi, "_") ?? "cast"}_list.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "Export complete",
            description: "CSV file downloaded successfully",
          });
        } else {
          toast({
            title: "PDF export",
            description: "PDF generation requires client-side rendering",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to export",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [showId, showInfo, includeContact, includeStatus, groupByRole, filterStatus, toast]
  );

  const toggleStatusFilter = useCallback((status: string) => {
    setFilterStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const filteredCast =
    filterStatus.length > 0 ? castList.filter((c) => filterStatus.includes(c.status)) : castList;

  const groupedCast = groupByRole
    ? filteredCast.reduce<Record<string, CastMember[]>>((acc, member) => {
        const type = member.roleType ?? "other";
        acc[type] ??= [];
        acc[type].push(member);
        return acc;
      }, {})
    : null;

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cast List
            {showInfo && <span className="text-muted-foreground">- {showInfo.title}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 flex-1" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {summary && (
              <div className="mb-4 grid grid-cols-4 gap-4">
                <Card
                  className={`cursor-pointer transition-colors ${filterStatus.includes("confirmed") ? "ring-2 ring-green-500" : ""}`}
                  onClick={() => {
                    toggleStatusFilter("confirmed");
                  }}
                >
                  <CardContent className="flex items-center gap-3 pt-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.confirmed}</div>
                      <div className="text-muted-foreground text-xs">Confirmed</div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${filterStatus.includes("tentative") ? "ring-2 ring-yellow-500" : ""}`}
                  onClick={() => {
                    toggleStatusFilter("tentative");
                  }}
                >
                  <CardContent className="flex items-center gap-3 pt-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.tentative}</div>
                      <div className="text-muted-foreground text-xs">Tentative</div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${filterStatus.includes("declined") ? "ring-2 ring-red-500" : ""}`}
                  onClick={() => {
                    toggleStatusFilter("declined");
                  }}
                >
                  <CardContent className="flex items-center gap-3 pt-4">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">{summary.declined}</div>
                      <div className="text-muted-foreground text-xs">Declined</div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${filterStatus.includes("draft") ? "ring-2 ring-gray-500" : ""}`}
                  onClick={() => {
                    toggleStatusFilter("draft");
                  }}
                >
                  <CardContent className="flex items-center gap-3 pt-4">
                    <AlertCircle className="h-8 w-8 text-gray-500" />
                    <div>
                      <div className="text-2xl font-bold">{summary.draft}</div>
                      <div className="text-muted-foreground text-xs">Draft</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <ScrollArea className="h-[350px] rounded-md border">
              {groupedCast ? (
                <div className="p-4">
                  {(["lead", "supporting", "ensemble", "understudy", "swing", "other"] as const)
                    .filter((type) => groupedCast[type]?.length)
                    .map((type) => (
                      <div key={type} className="mb-6 last:mb-0">
                        <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                          {type === "other" ? "Other Roles" : `${type}s`}
                        </h3>
                        <div className="space-y-2">
                          {groupedCast[type]?.map((member) => (
                            <CastMemberRow
                              key={`${member.roleId}-${String(member.slotIndex)}`}
                              member={member}
                              showStatus={includeStatus}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredCast.map((member) => (
                    <CastMemberRow
                      key={`${member.roleId}-${String(member.slotIndex)}`}
                      member={member}
                      showStatus={includeStatus}
                    />
                  ))}
                </div>
              )}

              {filteredCast.length === 0 && (
                <div className="flex h-32 items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    <p>No cast members found</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-contact"
                    checked={includeContact}
                    onCheckedChange={(c) => {
                      setIncludeContact(c);
                    }}
                  />
                  <Label htmlFor="include-contact" className="cursor-pointer text-sm">
                    Include contact info
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-status"
                    checked={includeStatus}
                    onCheckedChange={(c) => {
                      setIncludeStatus(c);
                    }}
                  />
                  <Label htmlFor="include-status" className="cursor-pointer text-sm">
                    Include status
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="group-by-role"
                    checked={groupByRole}
                    onCheckedChange={(c) => {
                      setGroupByRole(c);
                    }}
                  />
                  <Label htmlFor="group-by-role" className="cursor-pointer text-sm">
                    Group by role type
                  </Label>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => void fetchCastList()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleExport("csv")}
            disabled={isLoading || isExporting || filteredCast.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CastMemberRow({
  member,
  showStatus,
}: {
  member: CastMember;
  showStatus: boolean;
}): React.ReactElement {
  const statusKey = member.status as keyof typeof STATUS_ICONS;
  const StatusIcon = statusKey in STATUS_ICONS ? STATUS_ICONS[statusKey] : AlertCircle;
  const statusColor = statusKey in STATUS_COLORS ? STATUS_COLORS[statusKey] : "text-gray-500";

  return (
    <div className="hover:bg-muted/50 flex items-center gap-4 rounded-md border p-3 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{member.stageName ?? member.talentName}</div>
        <div className="text-muted-foreground text-sm">{member.roleName}</div>
      </div>
      {showStatus && (
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
          <Badge
            variant={
              member.status === "confirmed"
                ? "default"
                : member.status === "tentative"
                  ? "secondary"
                  : member.status === "declined"
                    ? "destructive"
                    : "outline"
            }
          >
            {member.status}
          </Badge>
          {member.responseType && member.responseType !== "pending" && (
            <Badge variant="outline" className="text-xs">
              {member.responseType}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
