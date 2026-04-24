"use client";

import { UNION_OPTIONS, type ProfileUpdate } from "@/lib/validations/profile";

interface UnionsStepProps {
  data: Partial<ProfileUpdate>;
  onUpdate: (data: Partial<ProfileUpdate>) => void;
}

export function UnionsStep({ data, onUpdate }: UnionsStepProps): React.ReactElement {
  const selectedUnions = data.unionMemberships ?? [];

  const toggleUnion = (value: string): void => {
    const newUnions = selectedUnions.includes(value)
      ? selectedUnions.filter((u) => u !== value)
      : [...selectedUnions, value];
    onUpdate({ unionMemberships: newUnions });
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select all unions you are a member of. This helps producers find talent that meets their
        production requirements.
      </p>

      <div className="space-y-3">
        {UNION_OPTIONS.map((union) => (
          <label
            key={union.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
              selectedUnions.includes(union.value)
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-muted/50"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedUnions.includes(union.value)}
              onChange={() => { toggleUnion(union.value); }}
              className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
            />
            <span className="font-medium">{union.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
