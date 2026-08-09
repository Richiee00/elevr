import { HyroxCategory, HyroxStation, HyroxStationParcial, HyroxWorkoutTemplate } from "./hyroxTypes";

export const STATION_LABELS: Record<HyroxStation, string> = {
  run: "Run",
  ski_erg: "Ski Erg",
  sled_push: "Sled Push",
  sled_pull: "Sled Pull",
  burpee_broad_jump: "Burpee Broad Jump",
  row_erg: "Row Erg",
  farmers_carry: "Farmers Carry",
  sandbag_lunges: "Sandbag Lunges",
  wall_balls: "Wall Balls",
  bike_erg: "Bike Erg",
  general: "Barbell / DB"
};

// Etiquetas para las claves de HyroxStationParcial (usadas por el análisis de benchmarks, distintas de HyroxStation).
export const PARCIAL_LABELS: Record<HyroxStationParcial, string> = {
  run1km: "Carrera (1km)",
  skiErg: "Ski Erg",
  sledPush: "Sled Push",
  sledPull: "Sled Pull",
  burpeeBroadJump: "Burpee Broad Jump",
  row: "Row Erg",
  farmersCarry: "Farmers Carry",
  sandbagLunges: "Sandbag Lunges",
  wallBalls: "Wall Balls",
  roxzoneTotal: "Roxzone / Transiciones"
};

export const CATEGORY_LABELS: Record<HyroxCategory, string> = {
  carrera: "Carrera",
  fuerza: "Fuerza",
  acondicionamiento: "Acondicionamiento",
  simulacion: "Simulación"
};

export const HYROX_STATIONS_ORDER: HyroxStation[] = [
  "run",
  "ski_erg",
  "sled_push",
  "sled_pull",
  "burpee_broad_jump",
  "row_erg",
  "farmers_carry",
  "sandbag_lunges",
  "wall_balls"
];

export const HYROX_WORKOUT_LIBRARY: HyroxWorkoutTemplate[] = [
  // ---------- CARRERA ----------
  {
    id: "running-tempo-blocks",
    name: "Running Tempo Blocks",
    category: "carrera",
    description: "Bloques de ritmo umbral para acostumbrar la pierna al ritmo de carrera exigido entre estaciones.",
    durationMin: 60,
    difficulty: "MODERADA",
    equipment: ["run"],
    targetStations: ["run"],
    blocks: [
      {
        format: "for_time",
        exercises: [{ station: "run", name: "Run", duration: "10:00", detail: "80% ritmo umbral" }]
      },
      {
        format: "intervals",
        label: "Superseries",
        rounds: 3,
        exercises: [
          { station: "run", name: "Run", duration: "10:00", detail: "95% ritmo umbral" },
          { station: "run", name: "Run", duration: "5:00", detail: "75% ritmo umbral" }
        ]
      },
      {
        format: "for_time",
        exercises: [{ station: "run", name: "Run", duration: "5:00", detail: "75% ritmo umbral" }]
      }
    ]
  },
  {
    id: "compromised-running-intervals",
    name: "Compromised Running Intervals",
    category: "carrera",
    description: "Carrera con las piernas ya fatigadas por burpees, tal y como se sufre en la Roxzone.",
    durationMin: 35,
    difficulty: "ALTA",
    equipment: ["run"],
    targetStations: ["run", "burpee_broad_jump"],
    blocks: [
      {
        format: "intervals",
        rounds: 6,
        restBetween: "1m30",
        exercises: [
          { station: "run", name: "Run", distance: "400 m" },
          { station: "burpee_broad_jump", name: "Burpee Broad Jump", reps: "15 rep" }
        ]
      }
    ]
  },
  {
    id: "roxzone-pacing-ladder",
    name: "Roxzone Pacing Ladder",
    category: "carrera",
    description: "Series largas a ritmo objetivo de carrera para automatizar el pace de tus 8x1km.",
    durationMin: 45,
    difficulty: "MODERADA",
    equipment: ["run"],
    targetStations: ["run"],
    blocks: [
      {
        format: "rounds",
        rounds: 5,
        restBetween: "1m30",
        exercises: [{ station: "run", name: "Run", distance: "1000 m", detail: "Ritmo objetivo de carrera" }]
      }
    ]
  },

  // ---------- FUERZA ----------
  {
    id: "anterior-strength",
    name: "Anterior Strength",
    category: "fuerza",
    description: "Fuerza de cadena anterior para Sled Push y Wall Balls.",
    durationMin: 40,
    difficulty: "MODERADA",
    equipment: ["general"],
    targetStations: ["sled_push", "wall_balls"],
    blocks: [
      {
        format: "for_time",
        rounds: 5,
        label: "5 series",
        restBetween: "2m",
        exercises: [{ station: "general", name: "DB Front Squat", reps: "5 rep", detail: "75% 1RM" }]
      },
      {
        format: "for_time",
        rounds: 4,
        label: "4 series",
        restBetween: "2m",
        exercises: [{ station: "general", name: "Barbell Strict Press", reps: "6 rep" }]
      }
    ]
  },
  {
    id: "posterior-power",
    name: "Posterior Power",
    category: "fuerza",
    description: "Cadena posterior para Sled Pull y Farmers Carry.",
    durationMin: 40,
    difficulty: "MODERADA",
    equipment: ["general", "sled_pull"],
    targetStations: ["sled_pull", "farmers_carry"],
    blocks: [
      {
        format: "for_time",
        rounds: 5,
        label: "5 series",
        restBetween: "2m",
        exercises: [{ station: "general", name: "Romanian Deadlift", reps: "6 rep", detail: "70% 1RM" }]
      },
      {
        format: "for_time",
        rounds: 4,
        label: "4 series",
        restBetween: "90 seg",
        exercises: [{ station: "sled_pull", name: "Sled Pull", distance: "20 m", detail: "Carga pesada" }]
      }
    ]
  },
  {
    id: "sled-push-pull-builder",
    name: "Sled Push & Pull Builder",
    category: "fuerza",
    description: "Volumen específico de trineo para ganar eficiencia técnica bajo fatiga.",
    durationMin: 30,
    difficulty: "ALTA",
    equipment: ["sled_push", "sled_pull"],
    targetStations: ["sled_push", "sled_pull"],
    blocks: [
      {
        format: "rounds",
        rounds: 6,
        restBetween: "90 seg",
        exercises: [
          { station: "sled_push", name: "Sled Push", distance: "25 m" },
          { station: "sled_pull", name: "Sled Pull", distance: "25 m" }
        ]
      }
    ]
  },
  {
    id: "farmers-sandbag-strength",
    name: "Farmers Carry & Sandbag Strength",
    category: "fuerza",
    description: "Fuerza de agarre y core anti-flexión para Farmers Carry y Sandbag Lunges.",
    durationMin: 30,
    difficulty: "MODERADA",
    equipment: ["farmers_carry", "sandbag_lunges"],
    targetStations: ["farmers_carry", "sandbag_lunges"],
    blocks: [
      {
        format: "rounds",
        rounds: 5,
        restBetween: "2m",
        exercises: [
          { station: "farmers_carry", name: "Farmers Carry", distance: "100 m" },
          { station: "sandbag_lunges", name: "Sandbag Lunges", distance: "50 m" }
        ]
      }
    ]
  },
  {
    id: "wall-ball-volume-builder",
    name: "Wall Ball Volume Builder",
    category: "fuerza",
    description: "EMOM de acumulación para el station final de la carrera, el más temido.",
    durationMin: 15,
    difficulty: "MODERADA",
    equipment: ["wall_balls"],
    targetStations: ["wall_balls"],
    blocks: [
      {
        format: "emom",
        rounds: 10,
        workDuration: "1m",
        exercises: [{ station: "wall_balls", name: "Wall Balls", reps: "15 rep" }]
      }
    ]
  },

  // ---------- ACONDICIONAMIENTO ----------
  {
    id: "on-off-grinder",
    name: "ON/OFF Grinder",
    category: "acondicionamiento",
    description: "Formato on/off que combina máquina, fuerza y explosividad bajo fatiga acumulada.",
    durationMin: 38,
    difficulty: "ALTA",
    equipment: ["row_erg", "general", "burpee_broad_jump"],
    targetStations: ["row_erg", "burpee_broad_jump"],
    blocks: [
      {
        format: "on_off",
        rounds: 4,
        workDuration: "8m",
        restBetween: "2m",
        label: "Interval 1/1",
        exercises: [
          { station: "row_erg", name: "Row Erg", distance: "500 m" },
          { station: "general", name: "Barbell Push Press", reps: "20 rep" },
          { station: "burpee_broad_jump", name: "Burpee Broad Jump", detail: "Máx repeticiones" }
        ]
      }
    ]
  },
  {
    id: "amrap-30-compromised",
    name: "AMRAP 30 Compromised",
    category: "acondicionamiento",
    description: "Carrera compromised con Wall Balls, Walking Lunges y Ski Erg en formato AMRAP.",
    durationMin: 30,
    difficulty: "ALTA",
    equipment: ["run", "wall_balls", "ski_erg"],
    targetStations: ["run", "wall_balls", "ski_erg"],
    blocks: [
      {
        format: "amrap",
        durationCap: "30m",
        exercises: [
          { station: "run", name: "Run", distance: "400 m" },
          { station: "wall_balls", name: "Wall Balls", reps: "20 rep" },
          { station: "sandbag_lunges", name: "DB Walking Lunges", reps: "20 rep" },
          { station: "ski_erg", name: "Ski Erg", distance: "400 m" }
        ]
      }
    ]
  },
  {
    id: "ski-row-intervals",
    name: "Ski/Row Intervals",
    category: "acondicionamiento",
    description: "Intervalos descendentes de máquina para VO2 máx y transición Ski-Row.",
    durationMin: 25,
    difficulty: "MODERADA",
    equipment: ["ski_erg", "row_erg"],
    targetStations: ["ski_erg", "row_erg"],
    blocks: [
      {
        format: "intervals",
        label: "Interval 1/4",
        restBetween: "1m",
        exercises: [{ station: "ski_erg", name: "Ski Erg", distance: "200 m" }]
      },
      {
        format: "intervals",
        label: "Interval 2/4",
        restBetween: "1m",
        exercises: [{ station: "row_erg", name: "Row Erg", distance: "200 m" }]
      },
      {
        format: "intervals",
        label: "Interval 3/4",
        restBetween: "1m",
        exercises: [{ station: "ski_erg", name: "Ski Erg", distance: "150 m" }]
      },
      {
        format: "intervals",
        label: "Interval 4/4",
        restBetween: "1m",
        exercises: [{ station: "row_erg", name: "Row Erg", distance: "150 m" }]
      }
    ]
  },
  {
    id: "long-60min-emom-grinder",
    name: "Long 60-Min EMOM Grinder",
    category: "acondicionamiento",
    description: "EMOM largo de acumulación aeróbica y muscular con bike y medicine ball.",
    durationMin: 60,
    difficulty: "BAJA",
    equipment: ["bike_erg", "general"],
    targetStations: ["bike_erg"],
    blocks: [
      {
        format: "emom",
        rounds: 20,
        workDuration: "3m",
        exercises: [
          { station: "bike_erg", name: "Bike Erg", duration: "1m", detail: "Ritmo moderado" },
          { station: "general", name: "DB Thrusters", reps: "12 rep" },
          { station: "general", name: "Medicine Ball Slams", reps: "15 rep" }
        ]
      }
    ]
  },
  {
    id: "acid-bath-amrap",
    name: "30-Min Acid Bath AMRAP",
    category: "acondicionamiento",
    description: "AMRAP de máquinas puras para acumular fatiga metabólica de alto nivel.",
    durationMin: 30,
    difficulty: "BAJA",
    equipment: ["bike_erg", "row_erg", "ski_erg"],
    targetStations: ["bike_erg", "row_erg", "ski_erg"],
    blocks: [
      {
        format: "amrap",
        durationCap: "30m",
        exercises: [
          { station: "bike_erg", name: "Bike Erg", detail: "20 cal" },
          { station: "row_erg", name: "Row Erg", detail: "20 cal" },
          { station: "ski_erg", name: "Ski Erg", detail: "20 cal" }
        ]
      }
    ]
  },
  {
    id: "long-metcon-intervals",
    name: "Long Metcon Intervals",
    category: "acondicionamiento",
    description: "Intervalos largos combinando mancuerna y remo para resistencia a la fuerza.",
    durationMin: 58,
    difficulty: "MODERADA",
    equipment: ["general", "row_erg"],
    targetStations: ["row_erg", "farmers_carry"],
    blocks: [
      {
        format: "intervals",
        rounds: 5,
        restBetween: "1m30",
        exercises: [
          { station: "general", name: "DB Farmers Carry", distance: "80 m" },
          { station: "row_erg", name: "Row Erg", distance: "300 m" }
        ]
      }
    ]
  },

  // ---------- SIMULACIÓN ----------
  {
    id: "hyrox-full-simulation",
    name: "Hyrox Full Simulation",
    category: "simulacion",
    description: "Simulación completa de las 8 estaciones oficiales intercaladas con 1km de carrera.",
    durationMin: 75,
    difficulty: "ALTA",
    equipment: ["run", "ski_erg", "sled_push", "sled_pull", "burpee_broad_jump", "row_erg", "farmers_carry", "sandbag_lunges", "wall_balls"],
    targetStations: HYROX_STATIONS_ORDER,
    blocks: [
      {
        format: "for_time",
        exercises: [
          { station: "run", name: "Run", distance: "1 km" },
          { station: "ski_erg", name: "Ski Erg", distance: "1000 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "sled_push", name: "Sled Push", distance: "50 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "sled_pull", name: "Sled Pull", distance: "50 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "burpee_broad_jump", name: "Burpee Broad Jump", distance: "80 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "row_erg", name: "Row Erg", distance: "1000 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "farmers_carry", name: "Farmers Carry", distance: "200 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "sandbag_lunges", name: "Sandbag Lunges", distance: "100 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "wall_balls", name: "Wall Balls", reps: "100 rep" }
        ]
      }
    ]
  },
  {
    id: "half-hyrox-simulation",
    name: "Half Hyrox Simulation",
    category: "simulacion",
    description: "Simulación reducida a 4 estaciones para introducir el formato de carrera sin agotar por completo.",
    durationMin: 40,
    difficulty: "MODERADA",
    equipment: ["run", "ski_erg", "sled_push", "row_erg", "wall_balls"],
    targetStations: ["run", "ski_erg", "sled_push", "row_erg", "wall_balls"],
    blocks: [
      {
        format: "for_time",
        exercises: [
          { station: "run", name: "Run", distance: "1 km" },
          { station: "ski_erg", name: "Ski Erg", distance: "500 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "sled_push", name: "Sled Push", distance: "25 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "row_erg", name: "Row Erg", distance: "500 m" },
          { station: "run", name: "Run", distance: "1 km" },
          { station: "wall_balls", name: "Wall Balls", reps: "40 rep" }
        ]
      }
    ]
  }
];

export function getTemplateById(id: string): HyroxWorkoutTemplate | undefined {
  return HYROX_WORKOUT_LIBRARY.find(t => t.id === id);
}
