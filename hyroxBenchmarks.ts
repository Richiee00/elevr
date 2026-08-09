// Auto-generated Hyrox performance benchmark tables. Source: user-provided coaching brain.
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
  dobles_masculina_open: {
    run1km: { sub60: "4:05", sub65: "4:25", sub70: "4:45", sub75: "5:05", sub80: "5:25", sub85: "5:45", sub90: "6:10" },
    skiErg: { sub60: "3:54", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
    sledPush: { sub60: "1:31", sub65: "1:40", sub70: "1:45", sub75: "1:55", sub80: "2:00", sub85: "2:10", sub90: "2:15" },
    sledPull: { sub60: "2:43", sub65: "2:55", sub70: "3:10", sub75: "3:25", sub80: "3:35", sub85: "3:50", sub90: "4:05" },
    burpeeBroadJump: { sub60: "2:09", sub65: "2:20", sub70: "2:30", sub75: "2:40", sub80: "2:50", sub85: "3:00", sub90: "3:15" },
    row: { sub60: "4:18", sub65: "4:40", sub70: "5:00", sub75: "5:25", sub80: "5:45", sub85: "6:05", sub90: "6:25" },
    farmersCarry: { sub60: "1:20", sub65: "1:25", sub70: "1:35", sub75: "1:40", sub80: "1:45", sub85: "1:55", sub90: "2:00" },
    sandbagLunges: { sub60: "2:56", sub65: "3:10", sub70: "3:25", sub75: "3:40", sub80: "3:55", sub85: "4:10", sub90: "4:25" },
    wallBalls: { sub60: "4:00", sub65: "4:20", sub70: "4:40", sub75: "5:00", sub80: "5:20", sub85: "5:40", sub90: "6:00" },
    roxzoneTotal: { sub60: "4:33", sub65: "4:55", sub70: "5:20", sub75: "5:40", sub80: "6:05", sub85: "6:25", sub90: "6:50" },
  },
  dobles_femenina_open: {
    run1km: { sub60: "4:00", sub65: "4:19", sub70: "4:40", sub75: "5:00", sub80: "5:20", sub85: "5:40", sub90: "6:00" },
    skiErg: { sub60: "4:30", sub65: "4:53", sub70: "5:15", sub75: "5:40", sub80: "6:00", sub85: "6:25", sub90: "6:45" },
    sledPush: { sub60: "2:00", sub65: "2:12", sub70: "2:20", sub75: "2:30", sub80: "2:45", sub85: "2:55", sub90: "3:05" },
    sledPull: { sub60: "3:20", sub65: "3:36", sub70: "3:55", sub75: "4:10", sub80: "4:25", sub85: "4:45", sub90: "5:00" },
    burpeeBroadJump: { sub60: "2:40", sub65: "2:51", sub70: "3:05", sub75: "3:20", sub80: "3:30", sub85: "3:45", sub90: "3:55" },
    row: { sub60: "4:45", sub65: "5:10", sub70: "5:35", sub75: "5:55", sub80: "6:20", sub85: "6:45", sub90: "7:10" },
    farmersCarry: { sub60: "1:20", sub65: "1:25", sub70: "1:30", sub75: "1:40", sub80: "1:45", sub85: "1:50", sub90: "2:00" },
    sandbagLunges: { sub60: "2:35", sub65: "2:49", sub70: "3:00", sub75: "3:15", sub80: "3:30", sub85: "3:40", sub90: "3:55" },
    wallBalls: { sub60: "3:15", sub65: "3:29", sub70: "3:45", sub75: "4:00", sub80: "4:20", sub85: "4:35", sub90: "4:50" },
    roxzoneTotal: { sub60: "3:55", sub65: "4:16", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:55" },
  },
  dobles_masculina_pro: {
    run1km: { sub60: "3:58", sub65: "4:20", sub70: "4:40", sub75: "5:00", sub80: "5:15", sub85: "5:35", sub90: "5:55" },
    skiErg: { sub60: "3:46", sub65: "4:05", sub70: "4:25", sub75: "4:45", sub80: "5:00", sub85: "5:20", sub90: "5:40" },
    sledPush: { sub60: "2:06", sub65: "2:15", sub70: "2:25", sub75: "2:40", sub80: "2:50", sub85: "3:00", sub90: "3:10" },
    sledPull: { sub60: "3:31", sub65: "3:50", sub70: "4:05", sub75: "4:25", sub80: "4:40", sub85: "5:00", sub90: "5:15" },
    burpeeBroadJump: { sub60: "2:21", sub65: "2:35", sub70: "2:45", sub75: "2:55", sub80: "3:10", sub85: "3:20", sub90: "3:30" },
    row: { sub60: "4:08", sub65: "4:30", sub70: "4:50", sub75: "5:10", sub80: "5:30", sub85: "5:50", sub90: "6:10" },
    farmersCarry: { sub60: "1:27", sub65: "1:35", sub70: "1:40", sub75: "1:50", sub80: "1:55", sub85: "2:05", sub90: "2:10" },
    sandbagLunges: { sub60: "3:13", sub65: "3:30", sub70: "3:45", sub75: "4:00", sub80: "4:15", sub85: "4:35", sub90: "4:50" },
    wallBalls: { sub60: "3:47", sub65: "4:05", sub70: "4:25", sub75: "4:45", sub80: "5:05", sub85: "5:20", sub90: "5:40" },
    roxzoneTotal: { sub60: "4:15", sub65: "4:35", sub70: "5:00", sub75: "5:20", sub80: "5:40", sub85: "6:00", sub90: "6:20" },
  },
  dobles_femenina_pro: {
    run1km: { sub60: "3:53", sub65: "4:10", sub70: "4:30", sub75: "4:50", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
    skiErg: { sub60: "4:12", sub65: "4:35", sub70: "4:55", sub75: "5:15", sub80: "5:35", sub85: "5:55", sub90: "6:20" },
    sledPush: { sub60: "2:20", sub65: "2:30", sub70: "2:45", sub75: "2:55", sub80: "3:05", sub85: "3:20", sub90: "3:30" },
    sledPull: { sub60: "3:09", sub65: "3:25", sub70: "3:40", sub75: "3:55", sub80: "4:10", sub85: "4:30", sub90: "4:45" },
    burpeeBroadJump: { sub60: "2:51", sub65: "3:05", sub70: "3:20", sub75: "3:35", sub80: "3:50", sub85: "4:00", sub90: "4:15" },
    row: { sub60: "4:30", sub65: "4:50", sub70: "5:15", sub75: "5:40", sub80: "6:00", sub85: "6:20", sub90: "6:45" },
    farmersCarry: { sub60: "1:42", sub65: "1:50", sub70: "2:00", sub75: "2:10", sub80: "2:15", sub85: "2:25", sub90: "2:35" },
    sandbagLunges: { sub60: "2:59", sub65: "3:15", sub70: "3:30", sub75: "3:45", sub80: "4:00", sub85: "4:15", sub90: "4:30" },
    wallBalls: { sub60: "3:42", sub65: "4:00", sub70: "4:20", sub75: "4:40", sub80: "4:55", sub85: "5:15", sub90: "5:35" },
    roxzoneTotal: { sub60: "3:54", sub65: "4:15", sub70: "4:35", sub75: "4:50", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
  },
  dobles_mixtos: {
    run1km: { sub60: "4:14", sub65: "4:35", sub70: "4:55", sub75: "5:20", sub80: "5:40", sub85: "6:00", sub90: "6:20" },
    skiErg: { sub60: "3:53", sub65: "4:10", sub70: "4:30", sub75: "4:50", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
    sledPush: { sub60: "1:50", sub65: "2:00", sub70: "2:10", sub75: "2:20", sub80: "2:25", sub85: "2:35", sub90: "2:45" },
    sledPull: { sub60: "2:44", sub65: "3:00", sub70: "3:10", sub75: "3:25", sub80: "3:40", sub85: "3:50", sub90: "4:05" },
    burpeeBroadJump: { sub60: "2:17", sub65: "2:30", sub70: "2:40", sub75: "2:50", sub80: "3:05", sub85: "3:15", sub90: "3:25" },
    row: { sub60: "3:58", sub65: "4:20", sub70: "4:40", sub75: "5:00", sub80: "5:15", sub85: "5:35", sub90: "5:55" },
    farmersCarry: { sub60: "1:13", sub65: "1:20", sub70: "1:25", sub75: "1:30", sub80: "1:35", sub85: "1:45", sub90: "1:50" },
    sandbagLunges: { sub60: "2:31", sub65: "2:45", sub70: "2:55", sub75: "3:10", sub80: "3:20", sub85: "3:35", sub90: "3:45" },
    wallBalls: { sub60: "3:34", sub65: "3:50", sub70: "4:10", sub75: "4:30", sub80: "4:45", sub85: "5:05", sub90: "5:20" },
    roxzoneTotal: { sub60: "4:11", sub65: "4:30", sub70: "4:55", sub75: "5:15", sub80: "5:35", sub85: "5:55", sub90: "6:15" },
  },
};

// Rango de tiempo total medio para debutantes (primera carrera), por categoría. [min, max] en "h:mm".
export const HYROX_DEBUTANTE_RANGE: Record<HyroxRaceCategory, [string, string]> = {
  open_masculina: ["1:35", "2:00"],
  open_femenina: ["1:45", "2:10"],
  pro_masculina: ["1:25", "1:50"],
  pro_femenina: ["1:35", "2:00"],
  dobles_masculina_open: ["1:15", "1:30"],
  dobles_femenina_open: ["1:25", "1:45"],
  dobles_masculina_pro: ["1:05", "1:20"],
  dobles_femenina_pro: ["1:15", "1:30"],
  dobles_mixtos: ["1:20", "1:40"],
};

