// Vercel Serverless Function (Node.js runtime). Vive en /api porque Vercel exige esa carpeta
// exacta para desplegar funciones — es la única excepción a la estructura plana del resto del repo.
//
// Genera el contenido de UNA sesión de Hyrox vía Gemini (mitad "viva" del motor híbrido).
// GEMINI_API_KEY se lee únicamente aquí, en servidor: nunca se expone al cliente.
import { GoogleGenAI, Type } from "@google/genai";

const HYROX_STATIONS = [
  "run",
  "ski_erg",
  "sled_push",
  "sled_pull",
  "burpee_broad_jump",
  "row_erg",
  "farmers_carry",
  "sandbag_lunges",
  "wall_balls",
  "bike_erg",
  "general"
];

const BLOCK_FORMATS = ["rounds", "amrap", "emom", "for_time", "intervals", "on_off"];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    durationMin: { type: Type.NUMBER },
    difficulty: { type: Type.STRING, enum: ["BAJA", "MODERADA", "ALTA"] },
    equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: HYROX_STATIONS } },
    targetStations: { type: Type.ARRAY, items: { type: Type.STRING, enum: HYROX_STATIONS } },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          format: { type: Type.STRING, enum: BLOCK_FORMATS },
          label: { type: Type.STRING },
          rounds: { type: Type.NUMBER },
          durationCap: { type: Type.STRING },
          workDuration: { type: Type.STRING },
          restBetween: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                station: { type: Type.STRING, enum: HYROX_STATIONS },
                name: { type: Type.STRING },
                reps: { type: Type.STRING },
                distance: { type: Type.STRING },
                duration: { type: Type.STRING },
                detail: { type: Type.STRING }
              },
              required: ["station", "name"]
            }
          }
        },
        required: ["format", "exercises"]
      }
    }
  },
  required: ["name", "description", "durationMin", "difficulty", "equipment", "targetStations", "blocks"]
};

function buildPrompt(input: Record<string, any>): string {
  const {
    category,
    objective,
    limitantType,
    experienceLevel,
    gymType,
    sessionDurationMin,
    isDescarga,
    injuryAreas,
    weekNumber,
    durationWeeks,
    raceCategory,
    division,
    loadContextNote
  } = input;

  const focusLine = limitantType
    ? `El limitante principal del atleta es "${limitantType}": prioriza estímulos que lo trabajen directamente.`
    : "El atleta no tiene un limitante claro identificado: mantén un estímulo equilibrado entre carrera, fuerza y acondicionamiento.";

  const gymLine =
    gymType === "convencional"
      ? "El atleta entrena en un gimnasio convencional (sin trineo oficial ni ski erg de competición): sustituye sled push/pull y ski erg por alternativas con barra, mancuernas, remo o assault bike cuando el bloque lo requiera."
      : "El atleta tiene acceso a un gimnasio especializado en Hyrox con las 8 estaciones oficiales: puedes usar cualquier estación oficial libremente.";

  const injuryLine =
    Array.isArray(injuryAreas) && injuryAreas.length > 0
      ? `El atleta reporta molestias o lesiones activas en: ${injuryAreas.join(", ")}. Evita ejercicios de alto impacto o carga directa sobre esas zonas; sustituye por variantes seguras.`
      : "Sin lesiones activas reportadas.";

  const loadLine = isDescarga
    ? "Esta es una semana de descarga: reduce volumen e intensidad un 30-40% respecto a una semana normal."
    : `Semana ${weekNumber} de ${durationWeeks} del plan: progresión de carga normal.`;

  // Cerebro v3, Objetivo 1, bloques A y D: categoría de competición (sexo + división) y sesgo de
  // intensidad por división, para que la sesión generada no sea idéntica entre open/pro ni entre sexos.
  const categoryLine = raceCategory ? `Categoría de competición del atleta: ${raceCategory}.` : "";
  const divisionLine =
    division === "pro"
      ? "División Pro: usa un nivel de dificultad más alto (prefiere ALTA o MODERADA sobre BAJA salvo que sea semana de descarga) y descansos entre series un 10-15% más cortos que en Open."
      : "División Open: dificultad normal según la fase, sin necesidad de forzar el nivel más alto.";
  const loadLine2 = loadContextNote ? String(loadContextNote) : "";

  return `Eres el motor de generación de sesiones de un entrenador de Hyrox. Genera UNA sesión de entrenamiento nueva, coherente con el método Hyrox oficial (formatos rounds/AMRAP/EMOM/for_time/intervals/on_off, las 8 estaciones oficiales + carrera), en español, para un atleta con las siguientes condiciones:

Categoría de la sesión: ${category}.
Objetivo del atleta: ${objective}.
Nivel de experiencia: ${experienceLevel}.
Duración objetivo de la sesión: ${sessionDurationMin} minutos.
${categoryLine}
${divisionLine}
${focusLine}
${gymLine}
${injuryLine}
${loadLine}
${loadLine2}

Devuelve una sesión original y variada (evita ser repetitiva respecto a plantillas genéricas), con bloques y ejercicios realistas y ejecutables, usando exclusivamente los formatos y estaciones permitidos por el esquema de respuesta. Si la sesión es de categoría "fuerza" y usa Sled Push, Sled Pull, Farmers Carry o Sandbag Lunges, usa las cargas indicadas arriba en vez de un porcentaje genérico de 1RM.`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(req.body ?? {});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) {
      res.status(502).json({ error: "Empty response from Gemini" });
      return;
    }

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? "Gemini generation failed" });
  }
}
