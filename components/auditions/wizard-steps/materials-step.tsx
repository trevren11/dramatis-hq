"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AuditionCreate, AuditionMaterialsInput } from "@/lib/validations/auditions";

interface MaterialsStepProps {
  data: Partial<AuditionCreate>;
  onUpdate: (data: Partial<AuditionCreate>) => void;
}

export function MaterialsStep({ data, onUpdate }: MaterialsStepProps): React.ReactElement {
  const materials = data.materials ?? {};

  const updateMaterials = (updates: Partial<AuditionMaterialsInput>): void => {
    onUpdate({ materials: { ...materials, ...updates } });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Required Materials</Label>
        <p className="text-muted-foreground text-sm">
          Select what applicants must submit with their application
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Headshot</Label>
            <p className="text-muted-foreground text-sm">Professional headshot photo</p>
          </div>
          <Switch
            checked={materials.requireHeadshot ?? false}
            onCheckedChange={(checked: boolean) => {
              updateMaterials({ requireHeadshot: checked });
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Resume</Label>
            <p className="text-muted-foreground text-sm">Acting/performance resume</p>
          </div>
          <Switch
            checked={materials.requireResume ?? false}
            onCheckedChange={(checked: boolean) => {
              updateMaterials({ requireResume: checked });
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Video Submission</Label>
              <p className="text-muted-foreground text-sm">Self-tape or video audition</p>
            </div>
            <Switch
              checked={materials.requireVideo ?? false}
              onCheckedChange={(checked: boolean) => {
                updateMaterials({ requireVideo: checked });
              }}
            />
          </div>
          {materials.requireVideo && (
            <Textarea
              value={materials.videoInstructions ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                updateMaterials({ videoInstructions: e.target.value });
              }}
              placeholder="Describe what the video should include (e.g., 16-bar cut of an uptempo song, 1-minute monologue)"
              rows={3}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Audio Submission</Label>
              <p className="text-muted-foreground text-sm">Audio recording or demo</p>
            </div>
            <Switch
              checked={materials.requireAudio ?? false}
              onCheckedChange={(checked: boolean) => {
                updateMaterials({ requireAudio: checked });
              }}
            />
          </div>
          {materials.requireAudio && (
            <Textarea
              value={materials.audioInstructions ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                updateMaterials({ audioInstructions: e.target.value });
              }}
              placeholder="Describe what the audio should include (e.g., 32-bar recording in your primary vocal range)"
              rows={3}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInstructions">Additional Instructions</Label>
        <Textarea
          id="additionalInstructions"
          value={materials.additionalInstructions ?? ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            updateMaterials({ additionalInstructions: e.target.value });
          }}
          placeholder="Any other instructions for applicants (e.g., what to wear, what to prepare, callback information)"
          rows={4}
        />
      </div>
    </div>
  );
}
