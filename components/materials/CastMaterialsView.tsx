"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Music, Download, Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Script, type MinusTrack } from "@/lib/db/schema";
import { AudioPlayer } from "./AudioPlayer";
import { ScriptViewer } from "./ScriptViewer";

interface MaterialWithPermission extends Script {
  canDownload: boolean;
  showTitle?: string;
}

interface TrackWithPermission extends MinusTrack {
  canDownload: boolean;
  showTitle?: string;
}

interface CastMaterialsViewProps {
  showId?: string;
  userName: string;
}

export function CastMaterialsView({
  showId,
  userName,
}: CastMaterialsViewProps): React.ReactElement {
  const [scripts, setScripts] = useState<MaterialWithPermission[]>([]);
  const [tracks, setTracks] = useState<TrackWithPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<
    (MaterialWithPermission & { url: string }) | null
  >(null);
  const [selectedTrack, setSelectedTrack] = useState<
    (TrackWithPermission & { url: string }) | null
  >(null);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const url = showId ? `/api/cast/materials?showId=${showId}` : "/api/cast/materials";
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch materials");
        }

        const data = (await response.json()) as {
          scripts: MaterialWithPermission[];
          tracks: TrackWithPermission[];
        };

        setScripts(data.scripts);
        setTracks(data.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMaterials();
  }, [showId]);

  // View script
  const viewScript = async (script: MaterialWithPermission): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${script.showId}/materials/scripts/${script.id}`);
      if (!response.ok) throw new Error("Failed to fetch script");

      const data = (await response.json()) as { script: Script; url: string; canDownload: boolean };
      setSelectedScript({
        ...script,
        url: data.url,
        canDownload: data.canDownload,
      });
    } catch (err) {
      console.error("Error viewing script:", err);
    }
  };

  // View track
  const viewTrack = async (track: TrackWithPermission): Promise<void> => {
    try {
      const response = await fetch(
        `/api/shows/${track.showId}/materials/tracks/${track.id}?stream=true`
      );
      if (!response.ok) throw new Error("Failed to fetch track");

      const data = (await response.json()) as {
        track: MinusTrack;
        url: string;
        canDownload: boolean;
      };
      setSelectedTrack({
        ...track,
        url: data.url,
        canDownload: data.canDownload,
      });
    } catch (err) {
      console.error("Error viewing track:", err);
    }
  };

  // Download script
  const downloadScript = async (script: MaterialWithPermission): Promise<void> => {
    try {
      const response = await fetch(
        `/api/shows/${script.showId}/materials/scripts/${script.id}?download=true`
      );
      if (!response.ok) throw new Error("Download not permitted");

      const data = (await response.json()) as { url: string };
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Error downloading script:", err);
    }
  };

  // Download track
  const downloadTrack = async (track: TrackWithPermission): Promise<void> => {
    try {
      const response = await fetch(
        `/api/shows/${track.showId}/materials/tracks/${track.id}?download=true`
      );
      if (!response.ok) throw new Error("Download not permitted");

      const data = (await response.json()) as { url: string };
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Error downloading track:", err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive font-medium">Error loading materials</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (scripts.length === 0 && tracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Production Materials
          </CardTitle>
          <CardDescription>Scripts and minus tracks shared with you</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <Music className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No materials have been shared with you yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Check back later or contact your production team
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={scripts.length > 0 ? "scripts" : "tracks"} className="w-full">
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
          {scripts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No scripts available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scripts.map((script) => (
                <Card
                  key={script.id}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer transition-colors",
                    selectedScript?.id === script.id && "border-primary"
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
                          <Badge variant="secondary">v{script.version}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {script.showTitle}
                          {script.revisionNotes && ` • ${script.revisionNotes}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          void viewScript(script);
                        }}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {script.canDownload && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            void downloadScript(script);
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Script Preview */}
          {selectedScript && (
            <ScriptViewer
              src={selectedScript.url}
              title={selectedScript.title ?? selectedScript.filename}
              version={selectedScript.version}
              canDownload={selectedScript.canDownload}
              onDownload={() => {
                void downloadScript(selectedScript);
              }}
              watermarkText={userName}
              className="mt-4"
            />
          )}
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          {tracks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No tracks available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
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
                      <div className="bg-muted rounded-lg p-2">
                        <Music className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">{track.title}</h4>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <span>{track.showTitle}</span>
                          {track.act && <span>• Act {track.act}</span>}
                          {track.scene && <span>Scene {track.scene}</span>}
                          {track.originalKey && (
                            <Badge variant="outline">{track.originalKey}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          void viewTrack(track);
                        }}
                        title="Play"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      {track.canDownload && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            void downloadTrack(track);
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Track Player */}
          {selectedTrack && (
            <AudioPlayer
              src={selectedTrack.url}
              title={selectedTrack.title}
              act={selectedTrack.act}
              scene={selectedTrack.scene}
              originalKey={selectedTrack.originalKey}
              canDownload={selectedTrack.canDownload}
              onDownload={() => {
                void downloadTrack(selectedTrack);
              }}
              className="mt-4"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
