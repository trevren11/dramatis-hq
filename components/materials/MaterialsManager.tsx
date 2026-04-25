/* eslint-disable max-lines */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  Music,
  Share2,
  Trash2,
  CheckCircle,
  Users,
  User,
  UserCircle,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Script, type MinusTrack, type Role, MUSICAL_KEYS } from "@/lib/db/schema";
import { AudioPlayer } from "./AudioPlayer";
import { ScriptViewer } from "./ScriptViewer";

interface MaterialsManagerProps {
  showId: string;
  initialScripts: Script[];
  initialTracks: MinusTrack[];
  roles: Role[];
  castMembers: { id: string; name: string; roleIds: string[] }[];
}

export function MaterialsManager({
  showId,
  initialScripts,
  initialTracks,
  roles,
  castMembers,
}: MaterialsManagerProps): React.ReactElement {
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [tracks, setTracks] = useState<MinusTrack[]>(initialTracks);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<MinusTrack | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Script upload dialog state
  const [scriptUploadOpen, setScriptUploadOpen] = useState(false);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptNotes, setScriptNotes] = useState("");

  // Track upload dialog state
  const [trackUploadOpen, setTrackUploadOpen] = useState(false);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackAct, setTrackAct] = useState("");
  const [trackScene, setTrackScene] = useState("");
  const [trackKey, setTrackKey] = useState("");
  const [trackNotes, setTrackNotes] = useState("");

  // Share dialog state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ type: "script" | "track"; id: string } | null>(
    null
  );
  const [shareWith, setShareWith] = useState<"all" | "roles" | "users">("all");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [canDownload, setCanDownload] = useState(false);

  // Upload script
  const handleScriptUpload = async (): Promise<void> => {
    if (!scriptFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", scriptFile);
      formData.append(
        "metadata",
        JSON.stringify({
          title: scriptTitle || undefined,
          revisionNotes: scriptNotes || undefined,
          isActive: true,
        })
      );

      const response = await fetch(`/api/shows/${showId}/materials/scripts`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to upload script");
      }

      const data = (await response.json()) as { script: Script };
      setScripts((prev) => prev.map((s) => ({ ...s, isActive: false })).concat(data.script));
      setScriptUploadOpen(false);
      setScriptFile(null);
      setScriptTitle("");
      setScriptNotes("");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Upload track
  const handleTrackUpload = async (): Promise<void> => {
    if (!trackFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", trackFile);
      formData.append(
        "metadata",
        JSON.stringify({
          title: trackTitle || trackFile.name.replace(/\.[^/.]+$/, ""),
          act: trackAct || undefined,
          scene: trackScene || undefined,
          originalKey: trackKey || undefined,
          notes: trackNotes || undefined,
        })
      );

      const response = await fetch(`/api/shows/${showId}/materials/tracks`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to upload track");
      }

      const data = (await response.json()) as { track: MinusTrack };
      setTracks((prev) => [...prev, data.track]);
      setTrackUploadOpen(false);
      setTrackFile(null);
      setTrackTitle("");
      setTrackAct("");
      setTrackScene("");
      setTrackKey("");
      setTrackNotes("");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Set active script
  const setActiveScript = async (scriptId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/materials/scripts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId }),
      });

      if (!response.ok) {
        throw new Error("Failed to set active script");
      }

      setScripts((prev) =>
        prev.map((s) => ({
          ...s,
          isActive: s.id === scriptId,
        }))
      );
    } catch (error) {
      console.error("Error setting active script:", error);
    }
  };

  // Delete script
  const deleteScript = async (scriptId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this script?")) return;

    try {
      const response = await fetch(`/api/shows/${showId}/materials/scripts/${scriptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete script");
      }

      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  // Delete track
  const deleteTrack = async (trackId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this track?")) return;

    try {
      const response = await fetch(`/api/shows/${showId}/materials/tracks/${trackId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete track");
      }

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
      }
    } catch (error) {
      console.error("Error deleting track:", error);
    }
  };

  // Share material
  const handleShare = async (): Promise<void> => {
    if (!shareTarget) return;

    try {
      if (shareWith === "all") {
        await fetch(`/api/shows/${showId}/materials/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialType: shareTarget.type,
            materialId: shareTarget.id,
            canDownload,
          }),
        });
      } else {
        const permissions =
          shareWith === "roles"
            ? selectedRoles.map((roleId) => ({
                grantType: "role" as const,
                grantedToRoleId: roleId,
                canDownload,
                canView: true,
              }))
            : selectedUsers.map((userId) => ({
                grantType: "user" as const,
                grantedToUserId: userId,
                canDownload,
                canView: true,
              }));

        await fetch(`/api/shows/${showId}/materials/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialType: shareTarget.type,
            materialId: shareTarget.id,
            permissions,
          }),
        });
      }

      setShareOpen(false);
      setShareTarget(null);
      setSelectedRoles([]);
      setSelectedUsers([]);
      setCanDownload(false);
    } catch (error) {
      console.error("Error sharing material:", error);
    }
  };

  // Open share dialog
  const openShare = (type: "script" | "track", id: string): void => {
    setShareTarget({ type, id });
    setShareOpen(true);
  };

  // View script
  const viewScript = async (script: Script): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/materials/scripts/${script.id}`);
      if (!response.ok) throw new Error("Failed to fetch script");

      const data = (await response.json()) as { script: Script; url: string };
      setSelectedScript({ ...data.script, s3Key: data.url });
    } catch (error) {
      console.error("Error viewing script:", error);
    }
  };

  // View track
  const viewTrack = async (track: MinusTrack): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/materials/tracks/${track.id}?stream=true`);
      if (!response.ok) throw new Error("Failed to fetch track");

      const data = (await response.json()) as { track: MinusTrack; url: string };
      setSelectedTrack({ ...data.track, s3Key: data.url });
    } catch (error) {
      console.error("Error viewing track:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scripts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Scripts ({scripts.length})
          </TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Minus Tracks ({tracks.length})
          </TabsTrigger>
        </TabsList>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Script Versions</h3>
              <p className="text-muted-foreground text-sm">Upload and manage script revisions</p>
            </div>
            <Dialog open={scriptUploadOpen} onOpenChange={setScriptUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Script
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Script</DialogTitle>
                  <DialogDescription>Upload a new script version (PDF only)</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="script-file">Script File</Label>
                    <Input
                      id="script-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        setScriptFile(e.target.files?.[0] ?? null);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="script-title">Title (optional)</Label>
                    <Input
                      id="script-title"
                      value={scriptTitle}
                      onChange={(e) => {
                        setScriptTitle(e.target.value);
                      }}
                      placeholder="e.g., Full Script with Act 2 Revisions"
                    />
                  </div>
                  <div>
                    <Label htmlFor="script-notes">Revision Notes</Label>
                    <Textarea
                      id="script-notes"
                      value={scriptNotes}
                      onChange={(e) => {
                        setScriptNotes(e.target.value);
                      }}
                      placeholder="Describe what changed in this version..."
                    />
                  </div>
                  {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScriptUploadOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      void handleScriptUpload();
                    }}
                    disabled={!scriptFile || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {scripts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No scripts uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scripts.map((script) => (
                <Card
                  key={script.id}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer transition-colors",
                    script.isActive && "border-primary"
                  )}
                  onClick={() => {
                    void viewScript(script);
                  }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-lg p-2">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{script.title ?? script.filename}</h4>
                          <Badge variant={script.isActive ? "default" : "secondary"}>
                            v{script.version}
                          </Badge>
                          {script.isActive && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Uploaded {new Date(script.uploadedAt).toLocaleDateString()}
                          {script.revisionNotes && ` • ${script.revisionNotes}`}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!script.isActive && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              void setActiveScript(script.id);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Set as Active
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openShare("script", script.id);
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteScript(script.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Script Preview */}
          {selectedScript && (
            <ScriptViewer
              src={selectedScript.s3Key}
              title={selectedScript.title ?? selectedScript.filename}
              version={selectedScript.version}
              canDownload={true}
              className="mt-4"
            />
          )}
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Minus Tracks</h3>
              <p className="text-muted-foreground text-sm">Upload and organize backing tracks</p>
            </div>
            <Dialog open={trackUploadOpen} onOpenChange={setTrackUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Track
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Minus Track</DialogTitle>
                  <DialogDescription>Upload an audio file (MP3, WAV, M4A)</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="track-file">Audio File</Label>
                    <Input
                      id="track-file"
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac"
                      onChange={(e) => {
                        setTrackFile(e.target.files?.[0] ?? null);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="track-title">Title</Label>
                    <Input
                      id="track-title"
                      value={trackTitle}
                      onChange={(e) => {
                        setTrackTitle(e.target.value);
                      }}
                      placeholder="e.g., Opening Number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="track-act">Act</Label>
                      <Input
                        id="track-act"
                        value={trackAct}
                        onChange={(e) => {
                          setTrackAct(e.target.value);
                        }}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="track-scene">Scene</Label>
                      <Input
                        id="track-scene"
                        value={trackScene}
                        onChange={(e) => {
                          setTrackScene(e.target.value);
                        }}
                        placeholder="3"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="track-key">Original Key</Label>
                    <RadixSelect value={trackKey} onValueChange={setTrackKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSICAL_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </RadixSelect>
                  </div>
                  <div>
                    <Label htmlFor="track-notes">Notes</Label>
                    <Textarea
                      id="track-notes"
                      value={trackNotes}
                      onChange={(e) => {
                        setTrackNotes(e.target.value);
                      }}
                      placeholder="Any additional notes..."
                    />
                  </div>
                  {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTrackUploadOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      void handleTrackUpload();
                    }}
                    disabled={!trackFile || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {tracks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No tracks uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tracks.map((track) => (
                <Card
                  key={track.id}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer transition-colors",
                    selectedTrack?.id === track.id && "border-primary"
                  )}
                  onClick={() => {
                    void viewTrack(track);
                  }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <GripVertical className="text-muted-foreground h-5 w-5 cursor-grab" />
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <Music className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">{track.title}</h4>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          {track.act && <span>Act {track.act}</span>}
                          {track.scene && <span>Scene {track.scene}</span>}
                          {track.originalKey && (
                            <Badge variant="outline">{track.originalKey}</Badge>
                          )}
                          {track.duration && (
                            <span>
                              {Math.floor(track.duration / 60)}:
                              {(track.duration % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openShare("track", track.id);
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteTrack(track.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Track Player */}
          {selectedTrack && (
            <AudioPlayer
              src={selectedTrack.s3Key}
              title={selectedTrack.title}
              act={selectedTrack.act}
              scene={selectedTrack.scene}
              originalKey={selectedTrack.originalKey}
              canDownload={true}
              className="mt-4"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Material</DialogTitle>
            <DialogDescription>Choose who can access this {shareTarget?.type}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Share with</Label>
              <RadixSelect
                value={shareWith}
                onValueChange={(v) => {
                  setShareWith(v as typeof shareWith);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Cast
                    </div>
                  </SelectItem>
                  <SelectItem value="roles">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Specific Roles
                    </div>
                  </SelectItem>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Specific People
                    </div>
                  </SelectItem>
                </SelectContent>
              </RadixSelect>
            </div>

            {shareWith === "roles" && (
              <div className="space-y-2">
                <Label>Select Roles</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles((prev) => [...prev, role.id]);
                          } else {
                            setSelectedRoles((prev) => prev.filter((r) => r !== role.id));
                          }
                        }}
                      />
                      <label htmlFor={`role-${role.id}`} className="text-sm">
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shareWith === "users" && (
              <div className="space-y-2">
                <Label>Select Cast Members</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {castMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`user-${member.id}`}
                        checked={selectedUsers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers((prev) => [...prev, member.id]);
                          } else {
                            setSelectedUsers((prev) => prev.filter((u) => u !== member.id));
                          }
                        }}
                      />
                      <label htmlFor={`user-${member.id}`} className="text-sm">
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="can-download"
                checked={canDownload}
                onCheckedChange={(checked) => {
                  setCanDownload(checked);
                }}
              />
              <label htmlFor="can-download" className="text-sm">
                Allow download
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShareOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleShare();
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
