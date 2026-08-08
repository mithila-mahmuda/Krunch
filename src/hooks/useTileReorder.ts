"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

type UseTileReorderOptions = {
  ids: string[];
  enabled: boolean;
  onReorder: (orderedIds: string[]) => void;
};

type Point = { x: number; y: number };

const SLIDE_MS = 120;
const SLIDE_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pointInRect(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/** Insert `dragId` so it occupies `slotIndex` in the resulting order. */
function orderWithDragAtSlot(
  originIds: string[],
  dragId: string,
  slotIndex: number,
): string[] {
  const without = originIds.filter((id) => id !== dragId);
  const clamped = Math.max(0, Math.min(slotIndex, without.length));
  without.splice(clamped, 0, dragId);
  return without;
}

function slotIndexForPoint(rects: DOMRect[], x: number, y: number): number {
  // Only commit a shift when the pointer is inside a slot — gaps keep the
  // current order so we don't thrash halfway between two tiles.
  for (let index = 0; index < rects.length; index += 1) {
    const rect = rects[index];
    if (rect && pointInRect(x, y, rect)) return index;
  }
  return -1;
}

/**
 * Live tile reorder without mid-drag layout thrash:
 * slots stay fixed, siblings slide via transform, dragged tile follows pointer.
 */
export function useTileReorder({
  ids,
  enabled,
  onReorder,
}: UseTileReorderOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  /** Frozen DOM/slot order for the active drag (render stays in this order). */
  const [originIds, setOriginIds] = useState<string[]>([]);
  /** Live visual order (and briefly after drop until props catch up). */
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);

  const draggingIdRef = useRef<string | null>(null);
  const originIdsRef = useRef<string[]>([]);
  const originIndexRef = useRef<Map<string, number>>(new Map());
  const slotRectsRef = useRef<DOMRect[]>([]);
  const previewIdsRef = useRef<string[]>([]);
  const pointerStartRef = useRef<Point>({ x: 0, y: 0 });
  const onReorderRef = useRef(onReorder);
  const idsRef = useRef(ids);
  const reducedMotionRef = useRef(false);

  idsRef.current = ids;
  onReorderRef.current = onReorder;

  useEffect(() => {
    if (draggingId) return;
    if (!previewIds) return;
    if (
      previewIds.length === ids.length &&
      previewIds.every((id, index) => id === ids[index])
    ) {
      setPreviewIds(null);
    }
  }, [ids, draggingId, previewIds]);

  useEffect(() => {
    if (!draggingId) return;

    function onPointerMove(event: PointerEvent) {
      const dragId = draggingIdRef.current;
      if (!dragId) return;

      setDragOffset({
        x: event.clientX - pointerStartRef.current.x,
        y: event.clientY - pointerStartRef.current.y,
      });

      const slotRects = slotRectsRef.current;
      if (slotRects.length === 0) return;

      const slotIndex = slotIndexForPoint(
        slotRects,
        event.clientX,
        event.clientY,
      );
      if (slotIndex < 0) return;

      const next = orderWithDragAtSlot(
        originIdsRef.current,
        dragId,
        slotIndex,
      );
      if (next.join() === previewIdsRef.current.join()) return;

      previewIdsRef.current = next;
      setPreviewIds(next);
    }

    function endDrag() {
      const dragId = draggingIdRef.current;
      const ordered = previewIdsRef.current;
      draggingIdRef.current = null;
      setDraggingId(null);
      setDragOffset({ x: 0, y: 0 });

      if (!dragId) return;

      const unchanged =
        ordered.length === idsRef.current.length &&
        ordered.every((id, index) => id === idsRef.current[index]);

      // Keep preview order until the store/props catch up (avoids one-frame snap).
      setPreviewIds(ordered);
      if (!unchanged) {
        onReorderRef.current(ordered);
      } else {
        setPreviewIds(null);
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [draggingId]);

  function startDrag(id: string, event: ReactPointerEvent) {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    reducedMotionRef.current = prefersReducedMotion();

    const nodes = [
      ...container.querySelectorAll<HTMLElement>("[data-reorder-id]"),
    ];
    const measuredIds: string[] = [];
    const rects: DOMRect[] = [];
    const indexById = new Map<string, number>();

    nodes.forEach((node) => {
      const nodeId = node.dataset.reorderId;
      if (!nodeId) return;
      indexById.set(nodeId, measuredIds.length);
      measuredIds.push(nodeId);
      rects.push(node.getBoundingClientRect());
    });

    if (!indexById.has(id)) return;

    originIdsRef.current = measuredIds;
    originIndexRef.current = indexById;
    slotRectsRef.current = rects;
    previewIdsRef.current = measuredIds;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    draggingIdRef.current = id;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still drive the drag.
    }

    setOriginIds(measuredIds);
    setPreviewIds(measuredIds);
    setDragOffset({ x: 0, y: 0 });
    setDraggingId(id);
  }

  /** Always render in origin/slot order while dragging — motion is transform-only. */
  const renderIds = draggingId ? originIds : (previewIds ?? ids);

  function tileProps(id: string) {
    const isDragging = draggingId === id;
    const originIndex = originIndexRef.current.get(id);
    const liveOrder = previewIds ?? previewIdsRef.current;
    const targetIndex =
      draggingId && liveOrder.length > 0 ? liveOrder.indexOf(id) : -1;

    let transform: string | undefined;
    let transition: string | undefined;

    if (isDragging) {
      transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.04)`;
      transition = "none";
    } else if (
      draggingId &&
      originIndex !== undefined &&
      targetIndex >= 0 &&
      originIndex !== targetIndex
    ) {
      const from = slotRectsRef.current[originIndex];
      const to = slotRectsRef.current[targetIndex];
      if (from && to) {
        const dx = to.left - from.left;
        const dy = to.top - from.top;
        transform = `translate3d(${dx}px, ${dy}px, 0)`;
        transition = reducedMotionRef.current
          ? "none"
          : `transform ${SLIDE_MS}ms ${SLIDE_EASE}`;
      }
    } else if (draggingId) {
      transform = "translate3d(0px, 0px, 0)";
      transition = reducedMotionRef.current
        ? "none"
        : `transform ${SLIDE_MS}ms ${SLIDE_EASE}`;
    }

    return {
      "data-reorder-id": id,
      "data-dragging": isDragging ? "true" : undefined,
      className: isDragging ? "menu-tile-dragging" : "menu-tile-idle",
      style: {
        transform,
        transition,
        zIndex: isDragging ? 40 : undefined,
        pointerEvents: isDragging ? "none" : undefined,
        position: "relative" as const,
        willChange: draggingId ? "transform" : undefined,
      } satisfies CSSProperties,
    };
  }

  function handleProps(id: string) {
    return {
      onPointerDown: (event: ReactPointerEvent) => startDrag(id, event),
      "aria-label": "Drag to reorder",
      title: "Drag to reorder",
    } as const;
  }

  return {
    containerRef: containerRef as RefObject<HTMLDivElement | null>,
    /** Ids to map in the grid (stable origin order during drag). */
    displayIds: renderIds,
    draggingId,
    isDragging: Boolean(draggingId),
    tileProps,
    handleProps,
  };
}
