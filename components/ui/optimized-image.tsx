"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  /** Show blur placeholder while loading */
  showBlur?: boolean;
  /** Fallback element to show on error */
  fallback?: React.ReactNode;
  /** Show skeleton while loading */
  showSkeleton?: boolean;
  /** Aspect ratio for skeleton placeholder (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
}

/**
 * An optimized image component that wraps next/image with:
 * - Lazy loading by default
 * - Optional blur placeholder
 * - Loading skeleton
 * - Error fallback
 * - Responsive srcset via Next.js
 */
export function OptimizedImage({
  src,
  alt,
  className,
  showBlur = true,
  fallback,
  showSkeleton = true,
  aspectRatio,
  ...props
}: OptimizedImageProps): React.ReactElement {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = (): void => {
    setIsLoading(false);
  };

  const handleError = (): void => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        className={cn("bg-muted text-muted-foreground flex items-center justify-center", className)}
        style={aspectRatio ? { aspectRatio } : undefined}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {isLoading && showSkeleton && <Skeleton className="absolute inset-0 h-full w-full" />}
      <Image
        src={src}
        alt={alt}
        className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={showBlur ? "blur" : undefined}
        blurDataURL={
          showBlur
            ? "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="
            : undefined
        }
        loading="lazy"
        {...props}
      />
    </div>
  );
}
