// Hyrox performance benchmark tables. Confirmed by the user against their own real data
// for open_masculina, open_femenina, pro_masculina y pro_femenina (2026-08-18).
import { HyroxRaceCategory, HyroxBenchmarkBand } from "./hyroxTypes";

export interface HyroxBenchmarkRow {
  run1km: Record<HyroxBenchmarkBand, string>;
  skiErg: Record<HyroxBenchmarkBand, string>;
  sledPush: Record<HyroxBenchmarkBand, string>;
  sledPull: Record<HyroxBenchmarkBand, string>;
  burpeeBroadJump: Record<HyroxBenchmarkBand, string>;
  row: Record<HyroxBenchmarkBand, string>;
  farmersCarry: Record<HyroxBenchmarkBand, string>;
  sandbagLunges: Record<HyroxBenchmarkBand, string>;
  wallBalls: Record<HyroxBenchmarkBand, string>;
  roxzoneTotal: Record<HyroxBenchmarkBand, string>;
}

export const HYROX_BENCHMARKS: Record<HyroxRaceCategory, HyroxBenchmarkRow> = {
  open_masculina: {
    run1km: { sub60: "3:49", sub65: "4:10", sub70: "4:25", sub75: "4:45", sub80: "5:05", sub85: "5:25", sub90: "5:45" },
    skiErg: { sub60: "4:13", sub65: "4:35", sub70: "4:55", sub75: "5:15", sub80: "5:35", sub85: "6:00", sub90: "6:20" },
    sledPush: { sub60: "2:50", sub65: "3:05", sub70: "3:20", sub75: "3:30", sub80: "3:45", sub85: "4:00", sub90: "4:15" },
    sledPull: { sub60: "2:59", sub65: "3:15", sub70: "3:30", sub75: "3:45", sub80: "4:00", sub85: "4:15", sub90: "4:30" },
    burpeeBroadJump: { sub60: "2:46", sub65: "3:00", sub70: "3:15", sub75: "3:30", sub80: "3:40", sub85: "3:55", sub90: "4:10" },
    row: { sub60: "4:17", sub65: "4:40", sub70: "5:00", sub75: "5:20", sub80: "5:45", sub85: "6:05", sub90: "6:25" },
    farmersCarry: { sub60: "1:30", sub65: "1:40", sub70: "1:45", sub75: "1:50", sub80: "2:00", sub85: "2:10", sub90: "2:15" },
    sandbagLunges: { sub60: "3:03", sub65: "3:20", sub70: "3:35", sub75: "3:50", sub80: "4:05", sub85: "4:20", sub90: "4:35" },
    wallBalls: { sub60: "4:31", sub65: "4:55", sub70: "5:15", sub75: "5:40", sub80: "6:00", sub85: "6:25", sub90: "6:45" },
    roxzoneTotal: { sub60: "4:00", sub65: "4:20", sub70: "4:40", sub75: "5:00", sub80: "5:20", sub85: "5:40", sub90: "6:00" },
  },
  open_femenina: {
    run1km: { sub60: "3:40", sub65: "3:58", sub70: "4:15", sub75: "4:35", sub80: "4:55", sub85: "5:10", sub90: "5:30" },
    skiErg: { sub60: "4:25", sub65: "4:48", sub70: "5:10", sub75: "5:30", sub80: "5:55", sub85: "6:15", sub90: "6:40" },
    sledPush: { sub60: "2:00", sub65: "2:11", sub70: "2:20", sub75: "2:30", sub80: "2:40", sub85: "2:50", sub90: "3:00" },
    sledPull: { sub60: "3:40", sub65: "4:01", sub70: "4:20", sub75: "4:40", sub80: "4:55", sub85: "5:15", sub90: "5:35" },
    burpeeBroadJump: { sub60: "3:30", sub65: "3:45", sub70: "4:00", sub75: "4:20", sub80: "4:35", sub85: "4:55", sub90: "5:10" },
    row: { sub60: "4:30", sub65: "4:52", sub70: "5:15", sub75: "5:35", sub80: "6:00", sub85: "6:20", sub90: "6:45" },
    farmersCarry: { sub60: "1:30", sub65: "1:35", sub70: "1:40", sub75: "1:50", sub80: "1:55", sub85: "2:05", sub90: "2:10" },
    sandbagLunges: { sub60: "2:35", sub65: "2:48", sub70: "3:00", sub75: "3:15", sub80: "3:25", sub85: "3:40", sub90: "3:55" },
    wallBalls: { sub60: "3:50", sub65: "4:11", sub70: "4:30", sub75: "4:50", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
    roxzoneTotal: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:55" },
  },
  pro_masculina: {
    run1km: { sub60: "3:39", sub65: "3:55", sub70: "4:15", sub75: "4:35", sub80: "4:50", sub85: "5:10", sub90: "5:30" },
    skiErg: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:50" },
    sledPush: { sub60: "3:17", sub65: "3:35", sub70: "3:50", sub75: "4:05", sub80: "4:25", sub85: "4:40", sub90: "4:55" },
    sledPull: { sub60: "4:34", sub65: "4:55", sub70: "5:20", sub75: "5:40", sub80: "6:05", sub85: "6:30", sub90: "6:50" },
    burpeeBroadJump: { sub60: "3:03", sub65: "3:20", sub70: "3:35", sub75: "3:50", sub80: "4:05", sub85: "4:20", sub90: "4:35" },
    row: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:50" },
    farmersCarry: { sub60: "1:34", sub65: "1:40", sub70: "1:50", sub75: "2:00", sub80: "2:05", sub85: "2:15", sub90: "2:20" },
    sandbagLunges: { sub60: "3:10", sub65: "3:25", sub70: "3:40", sub75: "3:55", sub80: "4:15", sub85: "4:30", sub90: "4:45" },
    wallBalls: { sub60: "3:45", sub65: "4:05", sub70: "4:25", sub75: "4:40", sub80: "5:00", sub85: "5:20", sub90: "5:40" },
    roxzoneTotal: { sub60: "3:44", sub65: "4:00", sub70: "4:20", sub75: "4:40", sub80: "5:00", sub85: "5:20", sub90: "5:35" },
  },
  pro_femenina: {
    run1km: { sub60: "3:40", sub65: "3:59", sub70: "4:20", sub75: "4:35", sub80: "4:55", sub85: "5:15", sub90: "5:30" },
    skiErg: { sub60: "4:15", sub65: "4:35", sub70: "4:55", sub75: "5:15", sub80: "5:40", sub85: "6:00", sub90: "6:20" },
    sledPush: { sub60: "2:50", sub65: "3:06", sub70: "3:20", sub75: "3:35", sub80: "3:50", sub85: "4:05", sub90: "4:20" },
    sledPull: { sub60: "4:00", sub65: "4:22", sub70: "4:40", sub75: "5:00", sub80: "5:25", sub85: "5:45", sub90: "6:05" },
    burpeeBroadJump: { sub60: "3:00", sub65: "3:17", sub70: "3:30", sub75: "3:45", sub80: "4:00", sub85: "4:20", sub90: "4:35" },
    row: { sub60: "4:20", sub65: "4:42", sub70: "5:05", sub75: "5:25", sub80: "5:45", sub85: "6:10", sub90: "6:30" },
    farmersCarry: { sub60: "1:55", sub65: "2:04", sub70: "2:15", sub75: "2:25", sub80: "2:35", sub85: "2:40", sub90: "2:50" },
    sandbagLunges: { sub60: "2:55", sub65: "3:12", sub70: "3:25", sub75: "3:40", sub80: "3:55", sub85: "4:10", sub90: "4:25" },
    wallBalls: { sub60: "4:10", sub65: "4:31", sub70: "4:50", sub75: "5:10", sub80: "5:35", sub85: "5:55", sub90: "6:15" },
    roxzoneTotal: { sub60: "3:40", sub65: "4:00", sub70: "4:20", sub75: "4:35", sub80: "4:55", sub85: "5:15", sub90: "5:30" },
  },
};

// Rango de tiempo total medio para debutantes (primera carrera), por categoría. [min, max] en "h:mm".
// Las categorías de dobles se retiraron de la app: no había tabla de tiempos real que las respaldara.
export const HYROX_DEBUTANTE_RANGE: Record<HyroxRaceCategory, [string, string]> = {
  open_masculina: ["1:35", "2:00"],
  open_femenina: ["1:45", "2:10"],
  pro_masculina: ["1:25", "1:50"],
  pro_femenina: ["1:35", "2:00"],
};

