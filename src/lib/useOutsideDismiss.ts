import { useEffect, useRef, type RefObject } from "react";

/**
 * Close a popover/menu when the user clicks (or taps) outside `containerRef`,
 * or presses Escape.
 */
export function useOutsideDismiss(
  open: boolean,
  onDismiss: () => void,
  containerRef: RefObject<HTMLElement | null>
): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        onDismissRef.current();
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismissRef.current();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, containerRef]);
}
