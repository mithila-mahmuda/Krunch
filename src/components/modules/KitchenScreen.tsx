"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { AssignedBranchBadge } from "@/components/AssignedBranchBadge";
import { SearchableMultiSelect } from "@/components/SearchableMultiSelect";
import { ModuleShell } from "@/components/modules/ModuleShell";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { useIsClient } from "@/hooks/useIsClient";
import { matchesBranchScope } from "@/lib/branch-access";
import { diningOptionLabel, formatElapsedClock } from "@/lib/format";
import type { KitchenStatus, KitchenTicket } from "@/lib/module-data";
import { useOpsStore } from "@/store/ops-store";
import { useSettingsStore } from "@/store/settings-store";

type ActiveKitchenStatus = Exclude<KitchenStatus, "served">;

const columns: { id: ActiveKitchenStatus; label: string; tone: string }[] = [
  { id: "queued", label: "Queued", tone: "border-sky-300" },
  { id: "preparing", label: "Preparing", tone: "border-amber-300" },
  { id: "ready", label: "Ready", tone: "border-emerald-300" },
];

const URGENT_AFTER_MS = 12 * 60_000;
const DRAG_THRESHOLD_PX = 8;

interface DragState {
  orderId: string;
  ticket: KitchenTicket;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

export function KitchenScreen() {
  const orders = useOpsStore((state) => state.orders);
  const showDemoSeed = useSettingsStore((state) => state.showDemoSeed);
  const advanceKitchen = useOpsStore((state) => state.advanceKitchen);
  const setKitchenStatus = useOpsStore((state) => state.setKitchenStatus);
  const now = useNow();
  const {
    options: branchOptions,
    selectedBranchIds,
    setSelectedBranchIds,
    branchIds,
    allLabel: branchAllLabel,
    showBranchFilter,
    branchBadgeName,
  } = useBranchFilter();

  const [drag, setDrag] = useState<DragState | null>(null);
  const mounted = useIsClient();

  const columnRefs = useRef<Partial<Record<KitchenStatus, HTMLElement | null>>>(
    {},
  );
  const slotRefs = useRef<Partial<Record<KitchenStatus, HTMLElement | null>>>(
    {},
  );
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<KitchenStatus | null>(null);
  const pointerRef = useRef({ clientX: 0, clientY: 0 });

  const tickets = useMemo(() => {
    void orders;
    void showDemoSeed;
    return useOpsStore
      .getState()
      .getKitchenTickets()
      .filter((ticket) => matchesBranchScope(ticket, branchIds));
  }, [orders, showDemoSeed, branchIds]);

  function syncFloatingPosition() {
    const node = floatingRef.current;
    const current = dragRef.current;
    if (!node || !current) return;
    const { clientX, clientY } = pointerRef.current;
    node.style.left = `${clientX - current.offsetX}px`;
    node.style.top = `${clientY - current.offsetY}px`;
  }

  // Timer ticks / store updates re-render this screen. Re-apply drag chrome
  // after every commit so React can't wipe the floating card position.
  useLayoutEffect(() => {
    if (!drag) return;
    syncFloatingPosition();
    paintDropTarget(dropTargetRef.current, drag.height);
  });

  function columnAtCardCenter(
    clientX: number,
    clientY: number,
  ): KitchenStatus | null {
    const current = dragRef.current;
    if (!current) return null;

    const centerX = clientX - current.offsetX + current.width / 2;
    const centerY = clientY - current.offsetY + current.height / 2;

    let best: { id: KitchenStatus; distance: number } | null = null;

    for (const column of columns) {
      const node = columnRefs.current[column.id];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const inY = centerY >= rect.top - 24 && centerY <= rect.bottom + 24;
      if (!inY) continue;

      if (centerX >= rect.left && centerX <= rect.right) {
        return column.id;
      }

      const midX = (rect.left + rect.right) / 2;
      const distance = Math.abs(centerX - midX);
      if (!best || distance < best.distance) {
        best = { id: column.id, distance };
      }
    }

    return best?.id ?? null;
  }

  function paintDropTarget(target: KitchenStatus | null, height: number) {
    for (const column of columns) {
      const section = columnRefs.current[column.id];
      const slot = slotRefs.current[column.id];
      const active = target === column.id;
      section?.classList.toggle("kitchen-col-drop", active);
      if (slot) {
        slot.style.height = active ? `${height}px` : "";
      }
    }
  }

  function clearDragChrome() {
    paintDropTarget(null, 0);
    dropTargetRef.current = null;
    dragRef.current = null;
  }

  function handleDragStart(next: DragState, clientX: number, clientY: number) {
    pointerRef.current = { clientX, clientY };
    dragRef.current = next;
    setDrag(next);

    const target = columnAtCardCenter(clientX, clientY);
    dropTargetRef.current = target;
    paintDropTarget(target, next.height);
  }

  function handleDragMove(clientX: number, clientY: number) {
    pointerRef.current = { clientX, clientY };
    syncFloatingPosition();

    const current = dragRef.current;
    if (!current) return;

    const target = columnAtCardCenter(clientX, clientY);
    if (target === dropTargetRef.current) return;
    dropTargetRef.current = target;
    paintDropTarget(target, current.height);
  }

  function handleDragEnd(orderId: string) {
    const target = dropTargetRef.current;
    if (target) {
      setKitchenStatus(orderId, target);
    }
    clearDragChrome();
    setDrag(null);
  }

  const floatingCard =
    mounted && drag
      ? createPortal(
          <div
            ref={(node) => {
              floatingRef.current = node;
              if (node) syncFloatingPosition();
            }}
            className="pointer-events-none fixed z-[100] rotate-1 scale-[1.02] shadow-2xl"
            style={{ width: drag.width }}
          >
            <KitchenCardBody ticket={drag.ticket} now={now} />
          </div>,
          document.body,
        )
      : null;

  return (
    <ModuleShell
      title="Kitchen Display"
      titleAddon={
        branchBadgeName ? (
          <AssignedBranchBadge name={branchBadgeName} />
        ) : null
      }
    >
      {showBranchFilter ? (
        <div className="mb-3 max-w-xs">
          <SearchableMultiSelect
            compact
            label="Branch"
            options={branchOptions}
            values={selectedBranchIds}
            onChange={setSelectedBranchIds}
            allLabel={branchAllLabel}
            searchPlaceholder="Search branches…"
          />
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const columnTickets = tickets.filter(
            (ticket) => ticket.status === column.id,
          );

          return (
            <section
              key={column.id}
              ref={(node) => {
                columnRefs.current[column.id] = node;
              }}
              className={`rounded-lg border-t-4 bg-white p-3 shadow-sm ${column.tone}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                  {column.label}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {columnTickets.length}
                </span>
              </div>
              <div className="min-h-28 space-y-3">
                <div
                  ref={(node) => {
                    slotRefs.current[column.id] = node;
                  }}
                  className="kitchen-drop-slot rounded-md border-2 border-dashed border-[var(--pos-accent)] bg-[var(--pos-accent)]/10"
                />
                {columnTickets.map((ticket) => (
                  <KitchenCard
                    key={ticket.id}
                    ticket={ticket}
                    now={now}
                    isDragging={drag?.orderId === ticket.orderId}
                    onAdvance={() => advanceKitchen(ticket.orderId)}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={() => handleDragEnd(ticket.orderId)}
                  />
                ))}
                {columnTickets.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400 empty-hint">
                    Clear — send or pay from the till
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {floatingCard}
    </ModuleShell>
  );
}

function KitchenCard({
  ticket,
  now,
  isDragging,
  onAdvance,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  ticket: KitchenTicket;
  now: number;
  isDragging: boolean;
  onAdvance: () => void;
  onDragStart: (
    drag: DragState,
    clientX: number,
    clientY: number,
  ) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const sessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);
  // Stable callbacks via refs so pointer capture isn't fighting stale closures.
  const startRef = useRef(onDragStart);
  const moveRef = useRef(onDragMove);
  const endRef = useRef(onDragEnd);
  useEffect(() => {
    startRef.current = onDragStart;
    moveRef.current = onDragMove;
    endRef.current = onDragEnd;
  }, [onDragStart, onDragMove, onDragEnd]);

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (!session.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      session.active = true;
      startRef.current(
        {
          orderId: ticket.orderId,
          ticket,
          width: rect.width,
          height: rect.height,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
        },
        event.clientX,
        event.clientY,
      );
      return;
    }
    moveRef.current(event.clientX, event.clientY);
  }

  function finishPointer(event: ReactPointerEvent<HTMLElement>) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    if (session.active) {
      endRef.current();
    }
    sessionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <article
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <KitchenCardBody ticket={ticket} now={now} onAdvance={onAdvance} />
    </article>
  );
}

function KitchenCardBody({
  ticket,
  now,
  onAdvance,
}: {
  ticket: KitchenTicket;
  now: number;
  onAdvance?: () => void;
}) {
  const startedAtMs = ticket.startedAt
    ? Date.parse(ticket.startedAt)
    : now - ticket.elapsedMinutes * 60_000;
  const elapsedLabel = formatElapsedClock(startedAtMs, now);
  const urgent = now - startedAtMs >= URGENT_AFTER_MS;

  return (
    <div
      className={`rounded-md border p-3 ${
        urgent ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">
            {ticket.orderNumber}
            {ticket.table ? (
              <span className="ml-2 text-slate-500">{ticket.table}</span>
            ) : null}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {diningOptionLabel(ticket.channel)}
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 font-mono text-xs font-bold tabular-nums ${
            urgent ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"
          }`}
          title="Time since fired to kitchen"
        >
          {elapsedLabel}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm font-medium">
        {ticket.items.map((item) => (
          <li key={`${ticket.id}-${item.name}`}>
            {item.quantity}× {item.name}
          </li>
        ))}
      </ul>

      {ticket.notes ? (
        <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
          {ticket.notes}
        </p>
      ) : null}

      {onAdvance ? (
        ticket.status === "ready" ? (
          <button
            type="button"
            onClick={onAdvance}
            className="mt-3 min-h-10 w-full rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Bump / served
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdvance}
            className="mt-3 min-h-10 w-full rounded-md bg-[var(--pos-header)] text-sm font-semibold text-pos-on-header hover:brightness-110"
          >
            {ticket.status === "queued" ? "Start prep" : "Mark ready"}
          </button>
        )
      ) : null}
    </div>
  );
}
