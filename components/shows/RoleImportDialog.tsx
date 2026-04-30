"use client";

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import type { Role } from "@/lib/db/schema/roles";
import { ROLE_TYPE_OPTIONS, ROLE_TYPE_VALUES } from "@/lib/db/schema/roles";

interface RoleImportDialogProps {
  showId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (roles: Role[]) => void;
}

type RoleField =
  | "name"
  | "description"
  | "type"
  | "ageRangeMin"
  | "ageRangeMax"
  | "vocalRange"
  | "notes"
  | "positionCount"
  | "skip";

type ColumnMapping = Record<string, RoleField>;

const ROLE_FIELDS: { value: RoleField; label: string; required?: boolean }[] = [
  { value: "skip", label: "-- Skip this column --" },
  { value: "name", label: "Role Name", required: true },
  { value: "description", label: "Description" },
  { value: "type", label: "Role Type" },
  { value: "ageRangeMin", label: "Min Age" },
  { value: "ageRangeMax", label: "Max Age" },
  { value: "vocalRange", label: "Vocal Range" },
  { value: "notes", label: "Casting Notes" },
  { value: "positionCount", label: "Number of Positions" },
];

// Common column name patterns for auto-detection
const COLUMN_PATTERNS: Record<RoleField, RegExp[]> = {
  name: [/^(role|character|name|part)$/i, /role.?name/i, /character.?name/i],
  description: [/^desc(ription)?$/i, /character.?desc/i, /about/i],
  type: [/^type$/i, /role.?type/i, /category/i],
  ageRangeMin: [/^(min.?age|age.?min|age.?from|from.?age)$/i, /^age$/i],
  ageRangeMax: [/^(max.?age|age.?max|age.?to|to.?age)$/i],
  vocalRange: [/^vocal/i, /^voice/i, /^range$/i],
  notes: [/^notes?$/i, /^casting/i, /^requirements?$/i, /^skills?$/i],
  positionCount: [/^(count|positions?|number|qty|quantity)$/i, /how.?many/i],
  skip: [],
};

function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<RoleField>();

  for (const header of headers) {
    const normalizedHeader = header.trim();
    let matched = false;

    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS) as [RoleField, RegExp[]][]) {
      if (field === "skip" || usedFields.has(field)) continue;

      for (const pattern of patterns) {
        if (pattern.test(normalizedHeader)) {
          mapping[header] = field;
          usedFields.add(field);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      mapping[header] = "skip";
    }
  }

  return mapping;
}

function parseRoleType(value: unknown): (typeof ROLE_TYPE_VALUES)[number] | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim();
  const match = ROLE_TYPE_VALUES.find((t) => t === normalized);
  return match;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return isNaN(value) ? null : Math.floor(value);
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

function convertToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

const TEXT_FIELDS = new Set<RoleField>(["description", "vocalRange", "notes"]);
const NUMBER_FIELDS = new Set<RoleField>(["ageRangeMin", "ageRangeMax", "positionCount"]);

function processFieldValue(role: Partial<Role>, field: RoleField, value: unknown): void {
  if (field === "name") {
    role.name = convertToString(value).trim();
  } else if (field === "type") {
    role.type = parseRoleType(value) ?? "supporting";
  } else if (TEXT_FIELDS.has(field) && value) {
    (role as Record<string, unknown>)[field] = convertToString(value).trim() || null;
  } else if (NUMBER_FIELDS.has(field)) {
    (role as Record<string, unknown>)[field] = parseNumber(value);
  }
}

function processRowToRole(
  row: Record<string, unknown>,
  columnMapping: ColumnMapping
): Partial<Role> | null {
  const role: Partial<Role> = {};

  for (const [column, field] of Object.entries(columnMapping)) {
    if (field === "skip") continue;
    processFieldValue(role, field, row[column]);
  }

  if (!role.name) return null;

  role.positionCount ??= 1;
  return role;
}

export function RoleImportDialog({
  showId,
  open,
  onOpenChange,
  onSuccess,
}: RoleImportDialogProps): React.ReactElement {
  const toastApi = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [previewData, setPreviewData] = useState<Partial<Role>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const resetState = useCallback((): void => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setColumnMapping({});
    setPreviewData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (!file) return;

      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        ".xlsx",
        ".xls",
      ];

      const isValidType = validTypes.some((type) => file.type === type || file.name.endsWith(type));

      if (!isValidType) {
        toastApi.toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e): void => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error("No sheets found in workbook");
          }

          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            throw new Error("Could not read worksheet");
          }

          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            defval: "",
          });

          if (jsonData.length === 0) {
            throw new Error("No data found in spreadsheet");
          }

          const headerRow = Object.keys(jsonData[0] ?? {});
          setHeaders(headerRow);
          setRows(jsonData);
          setColumnMapping(autoDetectMapping(headerRow));
          setStep("mapping");
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toastApi.toast({
            title: "Error reading file",
            description: error instanceof Error ? error.message : "Could not parse the Excel file",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [toastApi]
  );

  const handleMappingChange = useCallback((column: string, field: RoleField): void => {
    setColumnMapping((prev) => ({ ...prev, [column]: field }));
  }, []);

  const processPreview = useCallback((): void => {
    const validationErrors: string[] = [];

    // Check if name column is mapped
    const hasNameMapping = Object.values(columnMapping).includes("name");
    if (!hasNameMapping) {
      validationErrors.push("You must map at least one column to 'Role Name'");
      setErrors(validationErrors);
      return;
    }

    const processedRoles: Partial<Role>[] = [];

    for (const row of rows) {
      const role = processRowToRole(row, columnMapping);
      if (role) {
        processedRoles.push(role);
      }
    }

    if (processedRoles.length === 0) {
      validationErrors.push("No valid roles found in the data");
    }

    if (processedRoles.length > 50) {
      validationErrors.push("Maximum 50 roles can be imported at once");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setPreviewData(processedRoles);
    setStep("preview");
  }, [columnMapping, rows]);

  const handleImport = useCallback(async (): Promise<void> => {
    setStep("importing");

    try {
      const response = await fetch(`/api/shows/${showId}/roles/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: previewData }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to import roles");
      }

      const data = (await response.json()) as { roles: Role[] };

      toastApi.toast({
        title: "Import successful",
        description: `Imported ${String(data.roles.length)} role${data.roles.length !== 1 ? "s" : ""}`,
      });

      onSuccess(data.roles);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error("Import error:", error);
      toastApi.toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
      setStep("preview");
    }
  }, [showId, previewData, toastApi, onSuccess, onOpenChange, resetState]);

  const handleClose = useCallback(
    (isOpen: boolean): void => {
      if (!isOpen) {
        resetState();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetState]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Roles from Excel</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an Excel file containing your role list"}
            {step === "mapping" && "Map the columns in your spreadsheet to role fields"}
            {step === "preview" && "Review the data before importing"}
            {step === "importing" && "Importing roles..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-border hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-sm">Click to upload or drag and drop</p>
              <p className="text-muted-foreground text-xs">.xlsx or .xls files supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-medium">File:</span> {fileName}
              </p>
              <p className="text-muted-foreground text-sm">
                {String(rows.length)} row{rows.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    {errors.map((error, i) => (
                      <p key={i} className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Column Mapping</Label>
              <p className="text-muted-foreground text-xs">
                Auto-detected mappings shown below. Adjust as needed.
              </p>

              <div className="grid gap-3">
                {headers.map((header) => (
                  <div key={header} className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                    <div className="bg-muted truncate rounded px-3 py-2 text-sm">{header}</div>
                    <span className="text-muted-foreground text-sm">maps to</span>
                    <select
                      value={columnMapping[header] ?? "skip"}
                      onChange={(e) => {
                        handleMappingChange(header, e.target.value as RoleField);
                      }}
                      className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                    >
                      {ROLE_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                }}
              >
                Back
              </Button>
              <Button onClick={processPreview}>Continue to Preview</Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">{String(previewData.length)}</span> role
                {previewData.length !== 1 ? "s" : ""} ready to import
              </p>
            </div>

            <div className="max-h-[400px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Age Range</th>
                    <th className="px-3 py-2 text-left font-medium">Positions</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((role, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-muted-foreground max-w-xs truncate text-xs">
                            {role.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {ROLE_TYPE_OPTIONS.find((o) => o.value === role.type)?.label ?? role.type}
                      </td>
                      <td className="px-3 py-2">
                        {role.ageRangeMin != null || role.ageRangeMax != null
                          ? `${String(role.ageRangeMin ?? "?")} - ${String(role.ageRangeMax ?? "?")}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2">{role.positionCount ?? 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("mapping");
                }}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  void handleImport();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import {String(previewData.length)} Role{previewData.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-muted-foreground">Importing roles...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
