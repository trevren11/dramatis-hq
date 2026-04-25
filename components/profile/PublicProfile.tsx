"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { UNION_OPTIONS } from "@/lib/validations/profile";
import { MapPin, Globe, Briefcase, GraduationCap, Sparkles, Video, Play } from "lucide-react";
import type { TalentProfile, PublicSections } from "@/lib/db/schema/talent-profiles";
import type { VideoSample } from "@/lib/db/schema/video-samples";
import { VIDEO_CATEGORY_LABELS } from "@/lib/db/schema/video-samples";
import { VideoPlayer } from "@/components/video/video-player";
import {
  extractYouTubeId,
  extractVimeoId,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl,
} from "@/lib/validations/video-samples";

interface Props {
  profile: TalentProfile;
  sections: PublicSections;
  workHistory: { id: string; showName: string; role: string; category: string }[];
  education: { id: string; program: string; institution: string }[];
  headshots: { id: string; url: string; thumbnailUrl: string | null; isPrimary: boolean }[];
  videos: VideoSample[];
  skills: { id: string; name: string; category: string }[];
}

function getUnionLabel(value: string): string {
  return UNION_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

function getVideoSrc(video: VideoSample): string {
  if (video.sourceType === "youtube" && video.sourceUrl) {
    const videoId = extractYouTubeId(video.sourceUrl);
    return videoId ? getYouTubeEmbedUrl(videoId) : video.sourceUrl;
  }
  if (video.sourceType === "vimeo" && video.sourceUrl) {
    const videoId = extractVimeoId(video.sourceUrl);
    return videoId ? getVimeoEmbedUrl(videoId) : video.sourceUrl;
  }
  return video.processedUrl ?? video.sourceUrl ?? "";
}

// eslint-disable-next-line complexity
export function PublicProfile({
  profile,
  sections,
  workHistory,
  education,
  headshots,
  videos,
  skills,
}: Props): React.ReactElement {
  const [selectedVideo, setSelectedVideo] = useState<VideoSample | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const primaryHeadshot = headshots.find((p) => p.isPrimary) ?? headshots[0];
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const displayName = profile.stageName ?? `${profile.firstName} ${profile.lastName}`;

  // Filter videos by visibility (only show public videos)
  const publicVideos = videos.filter((v) => v.visibility === "public" && v.status === "ready");
  const featuredVideo = publicVideos.find((v) => v.isFeatured) ?? publicVideos[0];

  const handlePlayVideo = (video: VideoSample): void => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  return (
    <>
      {/* Header Section */}
      {sections.basicInfo && (
        <Card className="mb-6 overflow-hidden">
          <div className="from-primary/10 to-secondary/10 bg-gradient-to-r p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <Avatar className="ring-background h-32 w-32 shadow-xl ring-4">
                <AvatarImage src={primaryHeadshot?.url} alt={displayName} />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {profile.pronouns && (
                  <p className="text-muted-foreground mt-1">{profile.pronouns}</p>
                )}
                {profile.location && (
                  <div className="text-muted-foreground mt-2 flex items-center justify-center sm:justify-start">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile.unionMemberships && profile.unionMemberships.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile.unionMemberships.map((u) => (
                      <Badge key={u} variant="secondary">
                        {getUnionLabel(u)}
                      </Badge>
                    ))}
                  </div>
                )}
                {profile.website && (
                  <div className="mt-4 flex items-center justify-center sm:justify-start">
                    <Globe className="text-muted-foreground mr-2 h-4 w-4" />
                    <a
                      href={profile.website}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bio Section */}
      {sections.bio && profile.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Headshots Gallery */}
      {sections.headshots && headshots.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {headshots.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
                >
                  <Image
                    src={photo.thumbnailUrl ?? photo.url}
                    alt="Headshot"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Samples */}
      {sections.videos && publicVideos.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="mr-2 h-5 w-5" />
              Video Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Featured Video */}
            {featuredVideo && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    handlePlayVideo(featuredVideo);
                  }}
                  className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black"
                >
                  {featuredVideo.thumbnailUrl ? (
                    <Image
                      src={featuredVideo.thumbnailUrl}
                      alt={featuredVideo.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/90 p-4">
                      <Play className="h-8 w-8 text-black" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h4 className="text-left text-lg font-medium text-white">
                      {featuredVideo.title}
                    </h4>
                    <Badge className="mt-1" variant="secondary">
                      {VIDEO_CATEGORY_LABELS[featuredVideo.category]}
                    </Badge>
                  </div>
                </button>
              </div>
            )}

            {/* Other Videos Grid */}
            {publicVideos.length > 1 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {publicVideos
                  .filter((v) => v.id !== featuredVideo?.id)
                  .map((video) => (
                    <button
                      key={video.id}
                      onClick={() => {
                        handlePlayVideo(video);
                      }}
                      className="group relative aspect-video overflow-hidden rounded-lg bg-black text-left"
                    >
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Video className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-white/90 p-2">
                          <Play className="h-4 w-4 text-black" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="truncate text-sm font-medium text-white">{video.title}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      <Modal open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle>{selectedVideo?.title ?? "Video"}</ModalTitle>
          </ModalHeader>
          {selectedVideo && (
            <div className="space-y-4">
              {selectedVideo.sourceType === "upload" ? (
                <VideoPlayer
                  src={getVideoSrc(selectedVideo)}
                  poster={selectedVideo.thumbnailUrl ?? undefined}
                  title={selectedVideo.title}
                  className="aspect-video w-full"
                />
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <iframe
                    src={getVideoSrc(selectedVideo)}
                    title={selectedVideo.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {selectedVideo.description && (
                <p className="text-muted-foreground text-sm">{selectedVideo.description}</p>
              )}
              <Badge variant="secondary">{VIDEO_CATEGORY_LABELS[selectedVideo.category]}</Badge>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Work History */}
      {sections.workHistory && workHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workHistory.map((work) => (
                <div key={work.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold">{work.showName}</h4>
                  <p className="text-muted-foreground">{work.role}</p>
                  <Badge variant="outline" className="mt-1">
                    {work.category.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {sections.education && education.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold">{edu.program}</h4>
                  <p className="text-muted-foreground">{edu.institution}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {sections.skills && skills.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
