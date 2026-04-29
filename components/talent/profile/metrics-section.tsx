"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  WILLINGNESS_OPTIONS,
  type TalentProfile,
} from "@/lib/db/schema/talent-profiles";
import type { MetricVisibility } from "@/lib/validations/profile";

interface MetricsSectionProps {
  initialProfile: TalentProfile;
}

const HAIR_COLOR_LABELS: Record<string, string> = {
  black: "Black",
  brown: "Brown",
  blonde: "Blonde",
  red: "Red",
  auburn: "Auburn",
  gray: "Gray",
  white: "White",
  bald: "Bald",
  other: "Other",
};

const EYE_COLOR_LABELS: Record<string, string> = {
  brown: "Brown",
  blue: "Blue",
  green: "Green",
  hazel: "Hazel",
  gray: "Gray",
  amber: "Amber",
  other: "Other",
};

const ETHNICITY_LABELS: Record<string, string> = {
  asian: "Asian",
  black: "Black / African American",
  caucasian: "Caucasian / White",
  hispanic: "Hispanic / Latino",
  middle_eastern: "Middle Eastern",
  native_american: "Native American",
  pacific_islander: "Pacific Islander",
  south_asian: "South Asian",
  mixed: "Mixed / Multiracial",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const WILLINGNESS_LABELS: Record<string, string> = {
  yes: "Yes",
  no: "No",
  negotiable: "Negotiable",
};

const DEFAULT_VISIBILITY: MetricVisibility = {
  height: true,
  weight: false,
  eyeColor: true,
  hairColor: true,
  ethnicity: false,
  willingnessToChangeHair: false,
};

function formatHeight(inches: number | null | undefined): { feet: string; inches: string } {
  if (!inches) return { feet: "", inches: "" };
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return { feet: String(feet), inches: String(remainingInches) };
}

function parseHeight(feet: string, inches: string): number | null {
  const f = parseInt(feet, 10);
  const i = parseInt(inches, 10);
  if (isNaN(f) && isNaN(i)) return null;
  return (f || 0) * 12 + (i || 0);
}

export function MetricsSection({ initialProfile }: MetricsSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialHeight = formatHeight(initialProfile.heightInches);
  const [heightFeet, setHeightFeet] = useState(initialHeight.feet);
  const [heightInches, setHeightInches] = useState(initialHeight.inches);
  const [weight, setWeight] = useState(initialProfile.weightLbs?.toString() ?? "");
  const [eyeColor, setEyeColor] = useState<string | null>(initialProfile.eyeColor);
  const [hairColor, setHairColor] = useState<string | null>(initialProfile.hairColor);
  const [ethnicity, setEthnicity] = useState<string | null>(initialProfile.ethnicity);
  const [willingnessToChangeHair, setWillingnessToChangeHair] = useState<string | null>(
    initialProfile.willingnessToChangeHair
  );
  const [visibility, setVisibility] = useState<MetricVisibility>(() => {
    const saved = initialProfile.metricVisibility;
    return saved ?? DEFAULT_VISIBILITY;
  });

  const saveMetrics = useCallback(async () => {
    setIsSaving(true);
    try {
      const heightInchesTotal = parseHeight(heightFeet, heightInches);
      const weightLbs = weight ? parseInt(weight, 10) : null;

      const response = await fetch("/api/talent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightInches: heightInchesTotal,
          weightLbs: weightLbs !== null && isNaN(weightLbs) ? null : weightLbs,
          eyeColor,
          hairColor,
          ethnicity,
          willingnessToChangeHair,
          metricVisibility: visibility,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save metrics");
      }

      toast({
        title: "Metrics saved",
        description: "Your physical attributes have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save metrics",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    heightFeet,
    heightInches,
    weight,
    eyeColor,
    hairColor,
    ethnicity,
    willingnessToChangeHair,
    visibility,
    toast,
  ]);

  // Auto-save on changes
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      void saveMetrics();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    heightFeet,
    heightInches,
    weight,
    eyeColor,
    hairColor,
    ethnicity,
    willingnessToChangeHair,
    visibility,
    saveMetrics,
  ]);

  const toggleVisibility = (key: keyof MetricVisibility): void => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card id="metrics">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Physical Attributes</CardTitle>
            <CardDescription>
              These metrics help producers find talent for specific roles. Toggle visibility to
              control what appears on your public profile.
            </CardDescription>
          </div>
          {isSaving && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Height */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Height</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="3"
                max="8"
                value={heightFeet}
                onChange={(e) => {
                  setHeightFeet(e.target.value);
                }}
                className="w-20"
                placeholder="ft"
              />
              <span className="text-muted-foreground">ft</span>
              <Input
                type="number"
                min="0"
                max="11"
                value={heightInches}
                onChange={(e) => {
                  setHeightInches(e.target.value);
                }}
                className="w-20"
                placeholder="in"
              />
              <span className="text-muted-foreground">in</span>
            </div>
          </div>
          <VisibilityToggle
            visible={visibility.height}
            onToggle={() => {
              toggleVisibility("height");
            }}
          />
        </div>

        {/* Weight */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="50"
                max="500"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                }}
                className="w-24"
                placeholder="lbs"
              />
              <span className="text-muted-foreground">lbs</span>
            </div>
          </div>
          <VisibilityToggle
            visible={visibility.weight}
            onToggle={() => {
              toggleVisibility("weight");
            }}
          />
        </div>

        {/* Eye Color */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Eye Color</Label>
            <Select
              value={eyeColor ?? ""}
              onValueChange={(v) => {
                setEyeColor(v || null);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select eye color" />
              </SelectTrigger>
              <SelectContent>
                {EYE_COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {EYE_COLOR_LABELS[color]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VisibilityToggle
            visible={visibility.eyeColor}
            onToggle={() => {
              toggleVisibility("eyeColor");
            }}
          />
        </div>

        {/* Hair Color */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Hair Color</Label>
            <Select
              value={hairColor ?? ""}
              onValueChange={(v) => {
                setHairColor(v || null);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select hair color" />
              </SelectTrigger>
              <SelectContent>
                {HAIR_COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {HAIR_COLOR_LABELS[color]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VisibilityToggle
            visible={visibility.hairColor}
            onToggle={() => {
              toggleVisibility("hairColor");
            }}
          />
        </div>

        {/* Willing to Change Hair */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Willing to Change Hair Color/Style</Label>
            <Select
              value={willingnessToChangeHair ?? ""}
              onValueChange={(v) => {
                setWillingnessToChangeHair(v || null);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select willingness" />
              </SelectTrigger>
              <SelectContent>
                {WILLINGNESS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {WILLINGNESS_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VisibilityToggle
            visible={visibility.willingnessToChangeHair}
            onToggle={() => {
              toggleVisibility("willingnessToChangeHair");
            }}
          />
        </div>

        {/* Ethnicity */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label>Ethnicity</Label>
            <Select
              value={ethnicity ?? ""}
              onValueChange={(v) => {
                setEthnicity(v || null);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select ethnicity" />
              </SelectTrigger>
              <SelectContent>
                {ETHNICITIES.map((eth) => (
                  <SelectItem key={eth} value={eth}>
                    {ETHNICITY_LABELS[eth]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VisibilityToggle
            visible={visibility.ethnicity}
            onToggle={() => {
              toggleVisibility("ethnicity");
            }}
          />
        </div>

        <p className="text-muted-foreground text-xs">
          <Eye className="mr-1 inline h-3 w-3" /> Visible metrics appear on your public profile and
          are searchable by producers.
          <br />
          <EyeOff className="mr-1 inline h-3 w-3" /> Hidden metrics are only visible to you but
          remain searchable by producers.
        </p>
      </CardContent>
    </Card>
  );
}

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

function VisibilityToggle({ visible, onToggle }: VisibilityToggleProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 pt-7">
      <Switch checked={visible} onCheckedChange={onToggle} />
      {visible ? (
        <Eye className="text-muted-foreground h-4 w-4" />
      ) : (
        <EyeOff className="text-muted-foreground h-4 w-4" />
      )}
    </div>
  );
}
