// Chart tokens for the dark surface (validated categorical slots 1–2 + reserved status colors).
export const C = {
  surface: "#141414",
  grid: "#262626",
  axis: "#737373",
  text: "#d4d4d4",
  series1: "#3987e5", // blue — politician buy price / volume
  series2: "#d95926", // orange — current market price
  good: "#0ca30c",
  warning: "#fab219",
  neutral: "#737373",
  none: "#404040",
};

export const tooltipStyle = {
  contentStyle: { background: "#1b1b1b", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, color: "#f2f2f2" },
  labelStyle: { color: "#f2f2f2", fontWeight: 600 },
  itemStyle: { color: "#d4d4d4" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

export const axisProps = {
  stroke: C.axis,
  tick: { fill: C.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: C.grid },
};
