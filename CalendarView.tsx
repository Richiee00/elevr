import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrainingPlan, WorkoutSession } from "./types";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Activity,
  Award,
  CheckCircle2,
  CalendarCheck2,
  Sparkles,
  CalendarDays
} from "lucide-react";

interface CalendarViewProps {
  plan: TrainingPlan;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
}

export default function CalendarView({ plan, completedWorkouts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );

  const getLocalDateString = (dateInput: Date) => {
    const yyyy = dateInput.getFullYear();
    const mm = String(dateInput.getMonth() + 1).padStart(2, "0");
    const dd = String(dateInput.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // 1. Calculate base Monday for Week 1 using plan.createdAt
  const startMonday = useMemo(() => {
    const planDate = new Date(plan.createdAt);
    const day = planDate.getDay();
    // Adjust if day is Sunday (0) to -6, else 1 - day
    const diff = planDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(planDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [plan.createdAt]);

  // 2. Helper to get the week index in the training plan for a given calendar date
  const getWeekIndexForDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return -1;
    return Math.floor(diffDays / 7);
  };

  // 3. Helper to check if a specific plan week index is fully completed
  const isWeekFullyCompleted = (weekIndex: number) => {
    if (weekIndex < 0 || weekIndex >= plan.weeks.length) return false;
    const week = plan.weeks[weekIndex];
    const activeSessions = week.sessions.filter((s) => s.type !== "descanso");
    if (activeSessions.length === 0) return false;
    return activeSessions.every((s) => !!completedWorkouts[s.id]);
  };

  // 4. Map completed workouts with full details (type, name, etc.)
  const completedSessions = useMemo(() => {
    return Object.entries(completedWorkouts).map(([id, info]) => {
      let sessionType: "carrera" | "fuerza" | "descanso" | "movilidad" = "descanso";
      let sessionName = "Entrenamiento";
      let planWeekIndex = -1;
      let dayOfWeek = -1;

      for (let wIdx = 0; wIdx < plan.weeks.length; wIdx++) {
        const week = plan.weeks[wIdx];
        const s = week.sessions.find((item) => item.id === id);
        if (s) {
          sessionType = s.type;
          sessionName = s.name;
          planWeekIndex = wIdx;
          dayOfWeek = s.dayIndex;
          break;
        }
      }

      // Format local completion date
      const d = new Date(info.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const localDateStr = `${yyyy}-${mm}-${dd}`;

      return {
        id,
        type: sessionType,
        name: sessionName,
        weekIndex: planWeekIndex,
        dayOfWeek,
        localDate: localDateStr,
        ...info
      };
    });
  }, [completedWorkouts, plan]);



  // 6. Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(getLocalDateString(today));
  };

  // 7. Month calendar grid generation (Monday-start)
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    // JS: 0=Sunday, 1=Monday... Map to: 0=Monday, 6=Sunday
    const firstDayIdx = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Prev month padding
    for (let i = firstDayIdx - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    // Group into 7-day weeks
    const rows: Array<Array<{ date: Date; isCurrentMonth: boolean }>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return rows;
  }, [currentDate]);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];

  // Workouts for the selected day
  const selectedDaySessions = useMemo(() => {
    if (!selectedDayStr) return [];
    return completedSessions.filter((s) => s.localDate === selectedDayStr);
  }, [selectedDayStr, completedSessions]);

  // Monthly legend stats: entrenamientos realizados (fuerza/carrera) y días de descanso previstos,
  // cada uno como recuento y % sobre el total de días del mes mostrado.
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let fuerzaCount = 0;
    let carreraCount = 0;
    let descansoCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);

      if (completedSessions.some((s) => s.localDate === dateStr && s.type === "fuerza")) fuerzaCount++;
      if (completedSessions.some((s) => s.localDate === dateStr && s.type === "carrera")) carreraCount++;

      const planWeekIndex = getWeekIndexForDate(date);
      if (planWeekIndex >= 0 && planWeekIndex < plan.weeks.length) {
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const session = plan.weeks[planWeekIndex].sessions.find((s) => s.dayIndex === dayIndex);
        if (session && session.type === "descanso") descansoCount++;
      }
    }

    const pct = (count: number) => (daysInMonth > 0 ? Math.round((count / daysInMonth) * 100) : 0);
    return {
      daysInMonth,
      fuerza: { count: fuerzaCount, pct: pct(fuerzaCount) },
      carrera: { count: carreraCount, pct: pct(carreraCount) },
      descanso: { count: descansoCount, pct: pct(descansoCount) }
    };
  }, [currentDate, completedSessions, plan]);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mt-1.5 flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-blue-600" />
            Calendario de Progreso
          </h2>
          <p className="text-xs text-zinc-500 font-medium font-sans mt-1">
            Visualiza tu historial de entrenamientos y celebra tu consistencia semanal.
          </p>
        </div>
        <button
          onClick={handleGoToToday}
          className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer self-start sm:self-center shadow-sm"
        >
          Ir a Hoy
        </button>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Calendar Nav */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/80 bg-zinc-50/50">
          <h3 className="text-lg font-bold text-zinc-900 tracking-wide uppercase">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-700 transition cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-700 transition cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 font-sans">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Weeks Rows */}
          <div className="space-y-1.5">
            {calendarData.map((week, wIdx) => {
              // Check if this row represents a fully completed week of the plan
              const firstDayOfRow = week[0].date;
              const planWeekIndex = getWeekIndexForDate(firstDayOfRow);
              const isPerfectWeek = planWeekIndex >= 0 && isWeekFullyCompleted(planWeekIndex);

              return (
                <div
                  key={wIdx}
                  className={`grid grid-cols-7 gap-1.5 p-1 rounded-xl transition duration-300 relative ${
                    isPerfectWeek
                      ? "bg-emerald-50/80 border border-emerald-200"
                      : "border border-transparent"
                  }`}
                >
                  {/* Subtle perfect week decoration */}
                  {isPerfectWeek && (
                    <div className="absolute right-2 -top-1.5 z-10">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[7px] font-bold uppercase tracking-wider shadow-sm">
                        <Award className="w-2.5 h-2.5" />
                        Semana {planWeekIndex + 1} Completa
                      </div>
                    </div>
                  )}

                  {week.map(({ date, isCurrentMonth }, dIdx) => {
                    const dateStr = getLocalDateString(date);
                    const isSelected = selectedDayStr === dateStr;
                    const isToday = getLocalDateString(new Date()) === dateStr;

                    // Get completed sessions for this date
                    const daySessions = completedSessions.filter((s) => s.localDate === dateStr);
                    const hasFuerza = daySessions.some((s) => s.type === "fuerza");
                    const hasCarrera = daySessions.some((s) => s.type === "carrera");

                    return (
                      <button
                        key={dIdx}
                        onClick={() => setSelectedDayStr(dateStr)}
                        className={`aspect-square w-full rounded-lg p-1.5 flex flex-col justify-between text-left transition relative cursor-pointer group select-none ${
                          !isCurrentMonth
                            ? "opacity-30"
                            : "opacity-100"
                        } ${
                          isSelected
                            ? "bg-blue-600 text-white font-bold shadow-md border border-blue-600"
                            : isToday
                            ? "bg-blue-50 text-blue-600 font-bold border border-blue-300"
                            : "bg-zinc-50/80 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-900"
                        }`}
                      >
                        {/* Day Number */}
                        <div className="text-xs sm:text-sm font-bold font-mono">
                          {date.getDate()}
                        </div>

                        {/* Completed Workout Dot Indicators */}
                        <div className="flex flex-wrap gap-1 mt-auto items-center min-h-[6px]">
                          {hasCarrera && (
                            <span
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                isSelected
                                  ? "bg-white shadow-sm"
                                  : "bg-blue-600"
                              }`}
                              title="Carrera Completada"
                            />
                          )}
                          {hasFuerza && (
                            <span
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                isSelected
                                  ? "bg-orange-200 shadow-sm"
                                  : "bg-orange-500"
                              }`}
                              title="Fuerza Completada"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend Card */}
      <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">
            Leyenda de Entrenamientos · {monthNames[currentDate.getMonth()]}
          </span>
        </div>

        {/* Row 1: Monthly stats per type */}
        <div className="grid grid-cols-3 gap-3 text-center font-sans">
          <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Fuerza</span>
            </div>
            <p className="text-lg font-black text-zinc-900 font-mono">{monthStats.fuerza.count}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{monthStats.fuerza.pct}% del mes</p>
          </div>
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Carrera</span>
            </div>
            <p className="text-lg font-black text-zinc-900 font-mono">{monthStats.carrera.count}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{monthStats.carrera.pct}% del mes</p>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Descanso</span>
            </div>
            <p className="text-lg font-black text-zinc-900 font-mono">{monthStats.descanso.count}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{monthStats.descanso.pct}% del mes</p>
          </div>
        </div>

        {/* Row 2: Semana Completada & Fila Verde */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 border-t border-zinc-100 pt-3 text-[11px] text-zinc-600 font-sans">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-zinc-800">Semana Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
              Fila Verde
            </div>
            <span className="font-semibold text-zinc-800">Objetivo Cumplido al 100%</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2 font-sans">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          Detalle del Día:{" "}
          <span className="text-zinc-900 font-mono">
            {selectedDayStr ? (
              new Date(selectedDayStr + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            ) : (
              "Selecciona un día"
            )}
          </span>
        </h3>

        <AnimatePresence mode="wait">
          {selectedDaySessions.length > 0 ? (
            <motion.div
              key="details-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {selectedDaySessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    session.type === "fuerza"
                      ? "bg-orange-50/50 border-orange-200"
                      : "bg-blue-50/50 border-blue-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {session.type === "fuerza" ? (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-orange-200">
                          <Dumbbell className="w-3 h-3" /> FUERZA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-blue-200">
                          <Activity className="w-3 h-3" /> CARRERA
                        </span>
                      )}
                      <span className="text-xs text-zinc-500 font-bold font-mono uppercase tracking-wider">
                        Semana {session.weekIndex + 1} · {
                          ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][session.dayOfWeek] || ""
                        }
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 tracking-wide mt-1">
                      {session.name}
                    </h4>

                    {/* Feedback Display */}
                    <div className="text-xs text-zinc-700 font-medium font-sans flex items-center gap-1 mt-2">
                      <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Sensación:</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-800 text-[10px] capitalize font-semibold shadow-xs">
                        {session.feedback === "perfecto" ? "Perfecto 🌟" :
                         session.feedback === "adecuado" ? "Adecuado 👍" :
                         session.feedback === "muy_duro" ? "Muy Duro 🔥" :
                         session.feedback === "facil" ? "Fácil 😊" :
                         session.feedback === "incompleto" ? "Incompleto ⚠️" : "No Realizado 🛑"}
                      </span>
                    </div>
                  </div>

                  {/* RPE Indicator badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 p-3 bg-white border border-zinc-200/80 rounded-xl self-stretch sm:self-auto shrink-0 min-w-[110px] shadow-xs">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-sans">
                      Esfuerzo RPE
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold text-blue-600 font-mono">{session.rpeGiven || session.rpe}</span>
                      <span className="text-xs text-zinc-400 font-bold font-mono">/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty-day"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="py-10 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50"
            >
              <Sparkles className="w-6 h-6 text-zinc-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
                  Sin entrenamientos completados
                </p>
                <p className="text-[10px] text-zinc-400 font-medium font-sans mt-1 max-w-xs mx-auto">
                  El descanso también forma parte del entrenamiento. ¡No olvides registrar tus sesiones para verlas aquí!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
