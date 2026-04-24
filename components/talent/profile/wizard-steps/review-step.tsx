"use client";

import { UNION_OPTIONS, type ProfileUpdate } from "@/lib/validations/profile";

interface ReviewStepProps {
  data: Partial<ProfileUpdate>;
}

export function ReviewStep({ data }: ReviewStepProps): React.ReactElement {
  const getUnionLabels = (): string[] => {
    return (data.unionMemberships ?? []).map(
      (value) => UNION_OPTIONS.find((u) => u.value === value)?.label ?? value
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Review your profile information before completing setup. You can always update this later.
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Basic Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd>
                {data.firstName} {data.lastName}
              </dd>
            </div>
            {data.stageName && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stage Name</dt>
                <dd>{data.stageName}</dd>
              </div>
            )}
            {data.pronouns && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pronouns</dt>
                <dd>{data.pronouns}</dd>
              </div>
            )}
            {data.location && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location</dt>
                <dd>{data.location}</dd>
              </div>
            )}
          </dl>
        </div>

        {data.bio && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Bio</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{data.bio}</p>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Contact</h3>
          <dl className="space-y-2 text-sm">
            {data.phone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{data.phone}</dd>
              </div>
            )}
            {data.website && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Website</dt>
                <dd>{data.website}</dd>
              </div>
            )}
            {!data.phone && !data.website && (
              <p className="text-muted-foreground">No contact information added</p>
            )}
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Union Memberships</h3>
          {getUnionLabels().length > 0 ? (
            <ul className="text-sm">
              {getUnionLabels().map((label) => (
                <li key={label} className="text-muted-foreground">
                  • {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No unions selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
