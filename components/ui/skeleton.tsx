import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn("bg-muted animate-pulse rounded-md", className)} {...props} />;
}

/** Skeleton for text lines */
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 && "w-4/5")} />
      ))}
    </div>
  );
}

/** Skeleton for avatar/profile image */
function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}): React.ReactElement {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />;
}

/** Skeleton for card layouts */
function SkeletonCard({
  className,
  showImage = true,
  showAvatar = false,
}: {
  className?: string;
  showImage?: boolean;
  showAvatar?: boolean;
}): React.ReactElement {
  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      {showImage && <Skeleton className="h-32 w-full" />}
      <div className="flex items-center gap-3">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/** Skeleton for list items */
function SkeletonListItem({
  className,
  showAvatar = true,
}: {
  className?: string;
  showAvatar?: boolean;
}): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {showAvatar && <SkeletonAvatar size="sm" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Skeleton for table rows */
function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-32" : "flex-1")} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonListItem, SkeletonTableRow };
