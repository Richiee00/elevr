import React, { useRef, useEffect, useCallback, useState } from "react";

const ITEM_HEIGHT = 34;
const VISIBLE_COUNT = 5;
const HALF_VISIBLE = Math.floor(VISIBLE_COUNT / 2);

// Columna individual del wheel picker: scroll vertical con snap, valor centrado ampliado,
// vecinos difuminados/reducidos por distancia y degradado superior/inferior.
function WheelColumn({
  max,
  value,
  onChange,
  formatValue = (n: number) => n.toString().padStart(2, "0")
}: {
  max: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (n: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);
  const [centerFloat, setCenterFloat] = useState(value);
  const mounted = useRef(false);

  const values = Array.from({ length: max + 1 }, (_, i) => i);

  const scrollToIndex = useCallback((idx: number, smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToIndex(value, false);
    setCenterFloat(value);
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted.current) return;
    const el = containerRef.current;
    if (!el) return;
    const currentIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
    if (currentIdx !== value) {
      scrollToIndex(value, true);
      setCenterFloat(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const raw = el.scrollTop / ITEM_HEIGHT;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => setCenterFloat(raw));

    if (settleTimeout.current) clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(() => {
      const idx = Math.max(0, Math.min(max, Math.round(el.scrollTop / ITEM_HEIGHT)));
      scrollToIndex(idx, true);
      setCenterFloat(idx);
      if (idx !== value) onChange(idx);
    }, 100);
  };

  return (
    <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, width: 52 }}>
      {/* banda horizontal destacada del valor seleccionado */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 bg-blue-50 border-y border-blue-200/80 rounded-md pointer-events-none z-0"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative h-full overflow-y-scroll scrollbar-none z-10"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: ITEM_HEIGHT * HALF_VISIBLE }} />
        {values.map(v => {
          const dist = Math.abs(v - centerFloat);
          const opacity = Math.max(0.15, 1 - dist * 0.45);
          const scale = Math.max(0.72, 1 - dist * 0.14);
          const isSelected = dist < 0.5;
          return (
            <div
              key={v}
              className="flex items-center justify-center select-none"
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center", opacity, transform: `scale(${scale})` }}
            >
              <span
                className={`font-mono tabular-nums transition-none ${
                  isSelected ? "text-zinc-900 font-black text-lg" : "text-zinc-400 font-bold text-sm"
                }`}
              >
                {formatValue(v)}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * HALF_VISIBLE }} />
      </div>
      {/* degradado (fade effect) hacia arriba y hacia abajo */}
      <div
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-white to-transparent pointer-events-none z-20"
        style={{ height: ITEM_HEIGHT * HALF_VISIBLE }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"
        style={{ height: ITEM_HEIGHT * HALF_VISIBLE }}
      />
    </div>
  );
}

// Wheel picker de tiempo (mm:ss o hh:mm:ss), mismo API que el antiguo input por celdas:
// label / value ("mm:ss" o "hh:mm:ss") / onChange / mode. Cada segmento es su propia rueda.
export function WheelTimeInput({
  label,
  value,
  onChange,
  mode = "ms"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mode?: "ms" | "hms";
}) {
  const segments: Array<"h" | "m" | "s"> = mode === "hms" ? ["h", "m", "s"] : ["m", "s"];
  const maxes: Record<"h" | "m" | "s", number> = { h: 9, m: 59, s: 59 };
  const segmentLabel: Record<"h" | "m" | "s", string> = { h: "h", m: "m", s: "s" };

  const raw = value ? value.split(":") : [];
  const rawNums =
    mode === "hms"
      ? raw.length === 3
        ? raw
        : raw.length === 2
        ? ["0", raw[0], raw[1]]
        : ["0", "0", "0"]
      : raw.length === 2
      ? raw
      : raw.length === 3
      ? [raw[1], raw[2]]
      : ["0", "0"];
  const cellValues = rawNums.map(n => Math.max(0, Number(n) || 0));

  const setSegment = (idx: number, v: number) => {
    const updated = [...cellValues];
    updated[idx] = v;
    onChange(updated.map(n => n.toString().padStart(2, "0")).join(":"));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">{label}</label>
      <div className="flex items-center justify-center gap-1.5 bg-zinc-50/70 rounded-2xl px-3 py-2 border border-zinc-200/80 w-fit mx-auto">
        {segments.map((seg, idx) => (
          <React.Fragment key={seg}>
            {idx > 0 && <span className="text-zinc-400 font-black text-base">:</span>}
            <div className="flex flex-col items-center gap-1">
              <WheelColumn max={maxes[seg]} value={cellValues[idx] ?? 0} onChange={v => setSegment(idx, v)} />
              <span className="text-[9px] text-zinc-400 font-bold uppercase">{segmentLabel[seg]}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default WheelColumn;
