import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { classNames } from "../lib/ui";

interface AvatarProps {
  src?: string;
  alt: string;
  /** Shared box classes: size, rounding, ring, etc. */
  boxClassName: string;
  /** Size classes for the fallback icon. */
  iconClassName: string;
}

/**
 * Renders a facilitator headshot with a graceful fallback. Missing or broken
 * image URLs fall back to a simple profile icon.
 */
export function Avatar({ src, alt, boxClassName, iconClassName }: AvatarProps) {
  const [error, setError] = useState(false);
  const trimmed = (src ?? "").trim();

  // Reset the error state if the source changes (e.g. after an edit).
  useEffect(() => {
    setError(false);
  }, [trimmed]);

  if (trimmed && !error) {
    return (
      <img
        src={trimmed}
        alt={alt}
        onError={() => setError(true)}
        className={classNames(boxClassName, "object-cover")}
      />
    );
  }

  return (
    <div
      className={classNames(
        boxClassName,
        "flex items-center justify-center bg-slate-100 text-slate-400"
      )}
      aria-label={alt}
      role="img"
    >
      <User className={iconClassName} />
    </div>
  );
}
