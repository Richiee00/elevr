# CAPITOL BUY TRACKER

Dashboard web (Next.js + PostgreSQL) que consulta las **compras de acciones** declaradas por políticos de EE. UU. en [Capitol Trades](https://www.capitoltrades.com/trades?txType=buy&assetType=stock), valida cada registro individualmente y las compara con el **precio de mercado actual** para detectar acciones que cotizan **por debajo o cerca del precio de compra del político**.

> Transaction sizes are reported as ranges. Estimated volume uses the midpoint of each disclosed range and does not represent the exact transaction amount. Purchase disclosures may be published after the transaction date. Current market prices may be delayed depending on the selected data provider. This dashboard is for research purposes and is not financial advice.

---

## Índice

1. [Stack](#stack)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Arquitectura](#arquitectura)
4. [Reglas de validación](#reglas-de-validación)
5. [Fórmulas](#fórmulas)
6. [Esquema de base de datos](#esquema-de-base-de-datos)
7. [Variables de entorno](#variables-de-entorno)
8. [Ejecutar en local](#ejecutar-en-local)
9. [Datos mock (solo desarrollo)](#datos-mock-solo-desarrollo)
10. [Procesos de actualización](#procesos-de-actualización)
11. [Proveedores de precios](#proveedores-de-precios)
12. [Despliegue en Vercel](#despliegue-en-vercel)
13. [API](#api)
14. [Pruebas](#pruebas)
15. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS 3 (dark mode) |
| Gráficos | Recharts 2 |
| Base de datos | PostgreSQL (Neon, Vercel Postgres, Supabase o local) vía `pg` |
| Scraping HTML (respaldo) | cheerio |
| Tests | Vitest |
| Tareas programadas | Vercel Cron + scripts `tsx` |

## Estructura de carpetas

```
capitol-buy-tracker/
├── db/schema.sql                    # Esquema PostgreSQL (idempotente)
├── scripts/                         # CLI: migrate, update-trades, update-prices
├── src/
│   ├── app/                         # Pantallas y API (Next.js App Router)
│   │   ├── page.tsx                 # PANTALLA 1 · Overview
│   │   ├── trades/                  # PANTALLA 2 · Individual Trades
│   │   ├── stocks/                  # PANTALLA 3 · Stock Aggregation
│   │   ├── stocks/[ticker]/         # PANTALLA 4 · Stock Detail
│   │   ├── politicians/[id]/        # PANTALLA 5 · Politician Detail
│   │   ├── quality/                 # Panel de calidad de datos + logs
│   │   └── api/                     # dashboard, trades, stocks, politicians, options, quality, cron/*
│   ├── components/
│   │   ├── ui/                      # Card, KpiCard, DataTable, Badges, Pagination, States
│   │   ├── filters/FilterPanel.tsx  # Filtros, filtros rápidos, prima editable, presets guardados
│   │   ├── tables/                  # TradesTable, StocksTable
│   │   ├── charts/                  # Los 5 gráficos + distribución de precios
│   │   ├── layout/                  # Header, StatusBar, Disclaimer
│   │   └── views/                   # Vistas cliente de cada pantalla
│   ├── hooks/                       # useApi (loading/error), useFilters (estado en la URL)
│   ├── lib/
│   │   ├── sources/capitoltrades/   # OBTENCIÓN: API JSON (bff) + parser HTML de respaldo
│   │   ├── normalize/               # NORMALIZACIÓN y VALIDACIÓN (trade.ts, ticker.ts)
│   │   ├── db/                      # ALMACENAMIENTO: interfaz Repository, Postgres, Mock
│   │   ├── calc/                    # CÁLCULOS: size, finance, enrich, filters, aggregate
│   │   ├── prices/                  # Integración de proveedores de precios + sesión de mercado
│   │   ├── jobs/                    # updateTrades, updatePrices
│   │   ├── dataset.ts               # Carga + caché en memoria para las rutas API
│   │   ├── query.ts                 # Estado de filtros (URL ⇄ API), filtros rápidos
│   │   └── config.ts / log.ts / csv.ts / format.ts / cron.ts
│   └── mock/fixtures.ts             # ⚠ Datos MOCK, solo desarrollo
├── tests/                           # Fórmulas, Size, normalización, nunca-SELL, agregación, proveedores
├── vercel.json                      # Cron jobs
└── .env.example
```

## Arquitectura

```
Capitol Trades ──► sources/ ──► normalize/ ──► db/ (PostgreSQL) ◄── jobs/updatePrices ◄── prices/ (FMP, Finnhub…)
  (JSON o HTML)    RawTradeRecord   Trade | Rejection     │
                                                          ▼
                                    dataset.ts ──► calc/ (enrich, filtros, agregados) ──► app/api/* ──► componentes
```

* **Obtención** (`lib/sources`): primero la API JSON que usa la propia web (`bff.capitoltrades.com/trades`); si falla, la página HTML pública. Los parámetros `txType=buy&assetType=stock` son solo un pre-filtro: **cada fila se vuelve a validar**.
* **Normalización** (`lib/normalize/trade.ts`): convierte cada registro en un `Trade` o en un `Rejection` con su motivo.
* **Almacenamiento** (`lib/db`): interfaz `Repository` con dos implementaciones totalmente separadas (Postgres para producción y Mock en memoria para desarrollo).
* **Cálculos** (`lib/calc`): funciones puras y testeadas. Toda la lógica de negocio se ejecuta en el servidor; el navegador solo recibe filas ya calculadas y paginadas.
* **Presentación** (`components`, `app`): componentes cliente que leen la API. El estado de filtros vive en la URL, así que las vistas se pueden compartir.
* Las API keys solo se leen en el servidor (`lib/config.ts`). Ninguna variable lleva el prefijo `NEXT_PUBLIC_`.

## Reglas de validación

Una operación solo se guarda **y** se muestra si cumple TODAS estas condiciones (`normalizeTrade` + `isDisplayable`):

| # | Regla | Motivo de rechazo |
|---|---|---|
| 1 | TYPE normalizado es exactamente `BUY` (`BUY*` → `BUY`; el valor original se guarda en `tx_type_original`). `SELL`, `SALE`, `SALE_PARTIAL`, `EXCHANGE`, `RECEIVE`… se rechazan | `NOT_BUY` |
| 2 | ASSET TYPE es `STOCK` y el emisor no parece bono, T-Bill, fondo, private equity, deuda, commodity, opción, warrant, ETF ni cripto | `NOT_STOCK` |
| 3 | Ticker válido (`AAPL`, `BRK.B`…); `N/A` o vacío se rechaza | `MISSING_TICKER` |
| 4 | Precio de compra numérico y > 0 (`N/A`, vacío, `0` o texto se rechazan) | `MISSING_PRICE` |
| 5 | Rango Size válido con Estimated Size > 0 | `INVALID_SIZE` |
| 6 | Trade Date es una fecha válida | `INVALID_DATE` |
| 7 | No es un duplicado: clave `político \| ticker \| fecha \| tamaño \| precio \| propietario` (`UNIQUE` en BD) | contado como duplicado |
| 8 | Precio de compra y precio actual en la misma moneda (USD). Si no coinciden, no se calcula la variación → `CURRENCY_MISMATCH` | — |

Además, la base de datos impone `CHECK (tx_type = 'BUY')`, `CHECK (asset_type = 'STOCK')`, `purchase_price > 0` y `size_estimated > 0`, y `enrichTrades` vuelve a comprobar cada fila antes de mostrarla (defensa en profundidad).

## Fórmulas

Todas están en `src/lib/calc/finance.ts` y `src/lib/calc/size.ts`, con tests.

**Size** (`parseSizeRange`, `makeRange`). Los rangos de la declaración (`$1,001 – $15,000`) se normalizan a `1K–15K`:

```
Estimated Size = (Minimum Size + Maximum Size) / 2
1K–15K   → 1,000 / 15,000 / 8,000
50K–100K → 50,000 / 100,000 / 75,000
500K–1M  → 500,000 / 1,000,000 / 750,000
```

Los rangos abiertos (`> 50M`) usan el mínimo como estimación (criterio conservador). El rango original se conserva siempre en `size_label`.

**Variación**

```
Price Variation % = ((Current Price − Purchase Price) / Purchase Price) × 100
```

Se muestra con signo y dos decimales (verde > 0, rojo < 0, gris = 0). Si falta cualquiera de los dos precios, no se calcula.

**Estado de oportunidad** (prima `p` editable, 2.99 % por defecto):

```
BELOW  : Current < Purchase
NEAR   : Purchase ≤ Current ≤ Purchase × (1 + p/100)
ABOVE  : Current > Purchase × (1 + p/100)
Filtro "BELOW OR NEAR POLITICIAN BUY PRICE": Current ≤ Purchase × (1 + p/100)
```

**Precio medio ponderado por acción**

```
Weighted Average Buy Price = Σ(Purchase Price × Estimated Size) / Σ(Estimated Size)
Variation vs W. Avg %      = ((Current − W. Avg) / W. Avg) × 100
```

Ejemplo: $8,000 a $100 + $75,000 a $110 → **$109.04** (la media simple sería $105).

**Ordenación**: el tamaño siempre se ordena por el `Estimated Size` numérico, nunca por el texto del rango.
* Operaciones: Estimated Size ↓, Trade Date ↓, Published Date ↓.
* Acciones: Total Estimated Volume ↓, Unique Politicians ↓, Buy Transactions ↓.

## Esquema de base de datos

Archivo completo: [`db/schema.sql`](db/schema.sql).

| Tabla | Contenido |
|---|---|
| `trades` | Operaciones BUY/STOCK válidas. Las actualizaciones nunca borran filas. `dedupe_key UNIQUE`, `CHECK`s de tipo, activo, precio y tamaño |
| `rejected_trades` | Filas rechazadas con su motivo y el JSON original (auditoría) |
| `market_prices` | Último precio válido por ticker (caché): precio, moneda, proveedor, tipo (`INTRADAY`/`CLOSE`/`DELAYED`), `price_timestamp`, `fetched_at`, `last_attempt_at`, `last_error` |
| `price_snapshots` | Un precio por ticker y día (histórico) |
| `update_logs` | Log de cada ejecución: job, estado, estadísticas (JSON) y mensaje |

## Variables de entorno

Copia `.env.example` a `.env.local`. **Ninguna se expone al navegador.**

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (modo live) | Cadena de conexión PostgreSQL |
| `DATABASE_SSL` | No | `require` para Neon/Supabase/Vercel Postgres |
| `DATA_MODE` | No | `live` (por defecto) o `mock` (solo desarrollo; se rechaza con `NODE_ENV=production`) |
| `PRICE_PROVIDER` | No* | `fmp` · `finnhub` · `alphavantage` · `twelvedata` · `polygon` · `marketstack` |
| `PRICE_API_KEY` | No* | API key del proveedor |
| `PRICE_REQUESTS_PER_MINUTE` | No | Límite de peticiones (por defecto 50) |
| `PRICE_CACHE_TTL_HOURS` | No | No se vuelve a pedir un ticker con precio más reciente que esto (por defecto 20) |
| `PRICE_STALE_AFTER_HOURS` | No | A partir de aquí el precio se marca **STALE** (por defecto 48) |
| `PRICE_MAX_TICKERS_PER_RUN` | No | Máximo de tickers por ejecución (por defecto 500) |
| `MARKETSTACK_BASE_URL` | No | Por defecto `https://api.marketstack.com/v2` |
| `CAPITOL_TRADES_BFF_URL` / `CAPITOL_TRADES_WEB_URL` | No | Endpoints de origen |
| `TRADES_MAX_PAGES` | No | Páginas por ejecución (100 filas/página en la API JSON; por defecto 30) |
| `TRADES_STOP_AFTER_KNOWN_PAGES` | No | Modo incremental: se para tras N páginas seguidas sin filas nuevas |
| `TRADES_REQUEST_DELAY_MS` | No | Pausa entre páginas (por defecto 1200 ms) |
| `CRON_SECRET` | Sí (en Vercel) | Protege `/api/cron/*` |

\* Sin proveedor configurado, la app muestra **“Price data unavailable”**, no calcula variaciones, deja todas las filas fuera del filtro de oportunidad y muestra un aviso indicando que falta configurar la API.

## Ejecutar en local

Requisitos: Node.js ≥ 20 y PostgreSQL ≥ 14.

```bash
cd capitol-buy-tracker
npm install
cp .env.example .env.local          # edita DATABASE_URL y, si quieres, PRICE_PROVIDER / PRICE_API_KEY

# 1) Base de datos (ejemplo con Docker; o usa una instancia propia)
docker run -d --name cbt-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=capitol_buy_tracker postgres:16
npm run db:migrate

# 2) Carga inicial de operaciones y precios
npm run update:trades                # opcional: -- --pages=5
npm run update:prices                # opcional: -- --force (ignora la caché)

# 3) Arranca la app
npm run dev                          # http://localhost:3000
```

Producción local: `npm run build && npm start`.

Otros comandos:

```bash
npm test          # pruebas (Vitest)
npm run lint      # comprobación de tipos (tsc --noEmit)
```

## Datos mock (solo desarrollo)

```bash
npm run dev:mock     # DATA_MODE=mock, no necesita base de datos ni API keys
```

* Los datos están en `src/mock/fixtures.ts`: políticos **ficticios** con el sufijo `(MOCK)`, operaciones y precios deterministas, e incluye filas inválidas a propósito (SELL, bonos, T-Bills, cripto, ticker N/A, precio N/A y un duplicado) para ejercitar la validación y el panel de calidad.
* Se cargan solo en un repositorio **en memoria** (`MockRepository`): nunca se escriben en PostgreSQL ni se mezclan con datos reales.
* Todas las pantallas muestran un banner naranja **“MOCK DATA — DEVELOPMENT ONLY”**.
* `DATA_MODE=mock` lanza un error si `NODE_ENV=production`.

## Procesos de actualización

Hay dos procesos independientes, que se pueden lanzar por CLI o por HTTP (cron):

| Proceso | CLI | HTTP (cron) | Programación en Vercel |
|---|---|---|---|
| 1. Update political trades | `npm run update:trades` | `GET /api/cron/update-trades` | diario 12:00 UTC |
| 2. Update market prices | `npm run update:prices` | `GET /api/cron/update-prices[?force=1]` | diario 21:30 UTC (tras el cierre de EE. UU.) |

**Trades**: recupera páginas → normaliza → valida BUY y STOCK → elimina duplicados → inserta solo las filas nuevas (`ON CONFLICT DO NOTHING`) → guarda los rechazos → escribe un log en `update_logs`. Nunca borra histórico. Funciona en modo incremental (se detiene cuando las páginas ya no traen filas nuevas).

**Prices**: selecciona los tickers cotizados en EE. UU. con el precio más antiguo (caché `PRICE_CACHE_TTL_HOURS`), los pide al proveedor y:
* si tiene éxito → actualiza `market_prices` y `price_snapshots`;
* si falla → **mantiene el último precio válido**, guarda `last_error` y el estado del log pasa a `partial`/`error`. Cuando el precio supera `PRICE_STALE_AFTER_HOURS`, la UI lo marca como **STALE** y aparece un aviso.
* Solo se almacenan cotizaciones en USD (moneda de las declaraciones). Una cotización en otra moneda se registra como `Currency mismatch` y no se compara.

Cada precio muestra la fecha y hora de la última actualización y su tipo: **Market open** (intradía durante la sesión regular), **Prev. close** (cierre), **Delayed** o **Stale**.

## Proveedores de precios

Implementados en `src/lib/prices/providers.ts` bajo una interfaz común (`PriceProvider.fetchQuotes(tickers)`). Para añadir uno nuevo, implementa esa interfaz y regístralo en `src/lib/prices/index.ts`.

| `PRICE_PROVIDER` | Endpoint | Notas |
|---|---|---|
| `fmp` | `stable/quote?symbol=` | 1 petición por ticker; `BRK.B` → `BRK-B` |
| `finnhub` | `/api/v1/quote` | Plan gratuito: 60 req/min |
| `alphavantage` | `GLOBAL_QUOTE` | Plan gratuito ≈ 25 req/día → la caché va rotando los tickers; se detiene al recibir el aviso de límite |
| `twelvedata` | `/quote` (lotes de 8) | Devuelve moneda y si el mercado está abierto |
| `polygon` | `/v2/aggs/grouped/.../{fecha}` | **1 petición para todos los tickers** (cierre del último día con datos) — la opción más eficiente en plan gratuito |
| `marketstack` | `/eod/latest` (lotes de 100) | Precio de cierre |

## Despliegue en Vercel

1. **Base de datos**: crea una base PostgreSQL (Vercel → Storage → Neon Postgres, o Neon/Supabase directamente). Copia la cadena de conexión.
2. **Esquema**: desde tu máquina, `DATABASE_URL="postgres://…" DATABASE_SSL=require npm run db:migrate`.
3. **Importa el proyecto** en Vercel (New Project → tu repositorio) y define **Root Directory = `capitol-buy-tracker`**. Framework: Next.js (se detecta solo).
4. **Variables de entorno** (Settings → Environment Variables, entorno Production):
   * `DATABASE_URL`, `DATABASE_SSL=require`
   * `PRICE_PROVIDER`, `PRICE_API_KEY`
   * `CRON_SECRET` (una cadena larga y aleatoria; Vercel la envía como `Authorization: Bearer …` a los cron jobs)
   * No definas `DATA_MODE` (o usa `live`).
5. **Deploy**. Los cron jobs de `vercel.json` se registran solos (Settings → Cron Jobs). Las rutas de cron tienen `maxDuration = 300` s.
6. **Carga inicial**: lanza las dos actualizaciones una vez a mano (o con `npm run update:trades` / `update:prices` en local apuntando a la misma `DATABASE_URL`):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://TU-APP.vercel.app/api/cron/update-trades
   curl -H "Authorization: Bearer $CRON_SECRET" https://TU-APP.vercel.app/api/cron/update-prices
   ```
7. Revisa **Data Quality** (`/quality`) para ver las estadísticas y los logs de cada ejecución. Los logs estructurados (JSON) también aparecen en `vercel logs`.

> Si la carga inicial completa tarda más de lo que permite tu plan, ejecútala en local con `npm run update:trades -- --pages=200` contra la base de producción; después, el cron diario es incremental.

## API

Todas las rutas aceptan los parámetros de filtro (`q`, `dateFrom`, `dateTo`, `lastDays`, `politician`, `party`, `chamber`, `state`, `company`, `ticker`, `sector`, `owner`, `sizeLabel`, `minEst`, `maxEst`, `status`, `premium`, `maxFiledAfter`, `priceData`, `sort`, `dir`, `page`, `pageSize`, `bucket`).

| Ruta | Descripción |
|---|---|
| `GET /api/dashboard` | KPIs, gráficos, últimas compras grandes y oportunidades |
| `GET /api/trades[?format=csv]` | Operaciones filtradas, ordenadas y paginadas (o CSV completo) |
| `GET /api/stocks[?format=csv]` | Agregado por ticker |
| `GET /api/stocks/:ticker` | Detalle de una acción |
| `GET /api/politicians/:id` | Detalle de un político |
| `GET /api/options` | Valores disponibles para los filtros |
| `GET /api/quality` | Panel de calidad y logs |
| `GET /api/cron/update-trades` · `update-prices` | Procesos de actualización (requieren `CRON_SECRET`) |

## Pruebas

```bash
npm test
```

| Archivo | Cubre |
|---|---|
| `tests/finance.test.ts` | Variación % (los ejemplos de la especificación), límites BELOW/NEAR/ABOVE con prima editable, media ponderada, formato `$750K` / `$2.5M` / `+2.99%` |
| `tests/size.test.ts` | Normalización de Size para todos los rangos, rangos `$1,001 – $15,000`, rangos abiertos y entradas inválidas |
| `tests/never-sell.test.ts` | SELL / SALE / SALE_PARTIAL / EXCHANGE nunca llegan a la UI: normalización, filas manipuladas en la BD, pipeline mock completo, API JSON y HTML |
| `tests/normalize.test.ts` | Validación de tipo, activo, ticker, precio, fechas, deduplicación y conteo de rechazos |
| `tests/aggregate.test.ts` | Agregación por acción, ordenaciones por defecto, orden numérico del tamaño, monedas distintas, sin API de precios |
| `tests/providers.test.ts` | Adaptadores de los 6 proveedores de precios (con `fetch` simulado) y gestión de límites de uso |

## Limitaciones conocidas

* Capitol Trades no ofrece una API pública documentada. El endpoint JSON y el HTML pueden cambiar; el parser HTML localiza las columnas por el texto de la cabecera para minimizar roturas, y el panel de calidad deja ver enseguida si una ejecución deja de traer filas. Respeta sus términos de uso y no reduzcas `TRADES_REQUEST_DELAY_MS`.
* La sesión de mercado se calcula para NYSE/Nasdaq (09:30–16:00 ET, lunes a viernes), sin calendario de festivos; en festivos, el tipo de precio lo determina la marca de tiempo del proveedor.
* El sector solo está disponible cuando lo aporta la API JSON de Capitol Trades; si no, aparece como “Unknown”.
* Los presets de filtros guardados se almacenan en el navegador (`localStorage`). El estado actual de los filtros está siempre en la URL, así que se puede compartir.
