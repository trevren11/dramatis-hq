"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  physicalAttributesSchema,
  type PhysicalAttributes,
  heightToFeetInches,
  feetInchesToHeight,
} from "@/lib/validations/physical-attributes";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
  WILLINGNESS_OPTIONS,
  GENDERS,
} from "@/lib/db/schema/talent-profiles";

interface PhysicalAttributesFormProps {
  initialData?: Partial<PhysicalAttributes>;
  onSubmit: (data: PhysicalAttributes) => Promise<void>;
  isLoading?: boolean;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const hairColorOptions = HAIR_COLORS.map((color) => ({
  value: color,
  label: formatLabel(color),
}));

const eyeColorOptions = EYE_COLORS.map((color) => ({
  value: color,
  label: formatLabel(color),
}));

const ethnicityOptions = ETHNICITIES.map((ethnicity) => ({
  value: ethnicity,
  label: formatLabel(ethnicity),
}));

const vocalRangeOptions = VOCAL_RANGES.map((range) => ({
  value: range,
  label: formatLabel(range),
}));

const genderOptions = GENDERS.map((gender) => ({
  value: gender,
  label: formatLabel(gender),
}));

const willingnessOptions = WILLINGNESS_OPTIONS.map((option) => ({
  value: option,
  label: formatLabel(option),
}));

export function PhysicalAttributesForm({
  initialData,
  onSubmit,
  isLoading = false,
}: PhysicalAttributesFormProps): React.ReactElement {
  const initialHeight = initialData?.heightInches
    ? heightToFeetInches(initialData.heightInches)
    : { feet: 5, inches: 6 };

  const [heightFeet, setHeightFeet] = React.useState(initialHeight.feet);
  const [heightInches, setHeightInches] = React.useState(initialHeight.inches);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PhysicalAttributes>({
    resolver: zodResolver(physicalAttributesSchema),
    defaultValues: {
      ...initialData,
      heightInches: initialData?.heightInches ?? feetInchesToHeight(5, 6),
    },
  });

  React.useEffect(() => {
    setValue("heightInches", feetInchesToHeight(heightFeet, heightInches));
  }, [heightFeet, heightInches, setValue]);

  const handleFormSubmit = (data: PhysicalAttributes): void => {
    void onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Physical Attributes</CardTitle>
        <CardDescription>
          This information is only visible to producers searching for talent. It will not appear on
          your public profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e): void => {
            void handleSubmit(handleFormSubmit)(e);
          }}
          className="space-y-6"
        >
          {/* Height */}
          <div className="space-y-2">
            <Label>Height</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={3}
                max={8}
                value={heightFeet}
                onChange={(e): void => {
                  setHeightFeet(parseInt(e.target.value) || 0);
                }}
                className="w-20"
              />
              <span className="text-sm">ft</span>
              <Input
                type="number"
                min={0}
                max={11}
                value={heightInches}
                onChange={(e): void => {
                  setHeightInches(parseInt(e.target.value) || 0);
                }}
                className="w-20"
              />
              <span className="text-sm">in</span>
            </div>
            {errors.heightInches && (
              <p className="text-destructive text-sm">{errors.heightInches.message}</p>
            )}
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label>Playable Age Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Min"
                {...register("ageRangeLow", { valueAsNumber: true })}
                className="w-24"
              />
              <span className="text-sm">to</span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Max"
                {...register("ageRangeHigh", { valueAsNumber: true })}
                className="w-24"
              />
            </div>
            {errors.ageRangeLow && (
              <p className="text-destructive text-sm">{errors.ageRangeLow.message}</p>
            )}
          </div>

          {/* Hair and Eye Color */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hairColor">Current Hair Color</Label>
              <Select
                id="hairColor"
                options={hairColorOptions}
                placeholder="Select hair color"
                {...register("hairColor")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="naturalHairColor">Natural Hair Color</Label>
              <Select
                id="naturalHairColor"
                options={hairColorOptions}
                placeholder="Select natural hair color"
                {...register("naturalHairColor")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eyeColor">Eye Color</Label>
              <Select
                id="eyeColor"
                options={eyeColorOptions}
                placeholder="Select eye color"
                {...register("eyeColor")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                options={genderOptions}
                placeholder="Select gender"
                {...register("gender")}
              />
            </div>
          </div>

          {/* Ethnicity and Vocal Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ethnicity">Ethnicity (optional)</Label>
              <Select
                id="ethnicity"
                options={ethnicityOptions}
                placeholder="Select ethnicity"
                {...register("ethnicity")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocalRange">Vocal Range</Label>
              <Select
                id="vocalRange"
                options={vocalRangeOptions}
                placeholder="Select vocal range"
                {...register("vocalRange")}
              />
            </div>
          </div>

          {/* Willingness to cut hair */}
          <div className="space-y-2">
            <Label htmlFor="willingnessToRemoveHair">Willing to cut or color hair?</Label>
            <Select
              id="willingnessToRemoveHair"
              options={willingnessOptions}
              placeholder="Select option"
              {...register("willingnessToRemoveHair")}
            />
          </div>

          {/* 18+ Confirmation */}
          <div className="border-t pt-4">
            <Checkbox
              {...register("isOver18")}
              label="I confirm that I am 18 years of age or older"
            />
          </div>

          {/* Search Visibility */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Search Visibility</h4>
            <Checkbox
              {...register("hideFromSearch")}
              label="Hide my profile from producer searches"
            />
            <p className="text-muted-foreground mt-1 text-sm">
              Your profile will not appear in search results, but producers can still view it via
              direct link.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
