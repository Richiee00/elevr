import React, { useState, useMemo } from "react";
import { HyroxTrainingPlan, HyroxCategory } from "../../hyroxTypes";
import { getTemplateById, CATEGORY_LABELS } from "../../hyroxLibrary";
import { ChevronLeft, ChevronRight, CalendarCheck2, CheckCircle2 } from "lucide-react";

interface HyroxCalendarViewProps {
  plan: HyroxTrainingPlan;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
}

const CATEGORY_DOT: Record<HyroxCategory, string> = {
  carrera: "bg-blue-500",
  fuerza: "bg-purple-500",
  acondicionamiento: "bg-orange-500",
  simulacion: "bg-rose-500"
};

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function HyroxCalendarView({ plan, completedWorkouts }: HyroxCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(new Date().toISOString().split("T")[0]);

  const getLocalDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const startMonday = useMemo(() => {
    const planDate = new Date(plan.createdAt);
    const day = planDate.getDay();
    const diff = planDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(planDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [plan.createdAt]);

  const getSessionForDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((d.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekIdx = Math.floor(diffDays / 7);
    const dayIdx = diffDays % 7;
    const week = plan.weeks[weekIdx];
    if (!week) return null;
    return week.sessions[dayIdx] || null;
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayIdx = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    for (let i = firstDayIdx - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let i = 1; i <= remaining; i++) cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });

    const rows: Array<Array<{ date: Date; isCurrentMonth: boolean }>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [currentDate]);

  const selectedSession = selectedDayStr ? getSessionForDate(new Date(selectedDayStr)) : null;
  const selectedTemplate = selectedSession?.templateId ? getTemplateById(selectedSession.templateId) : undefined;
  const selectedCompleted = selectedSession ? completedWorkouts[selectedSession.id] : undefined;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-blue-600" />
            Calendario Hyrox
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">Visualiza tu plan y tu historial de entrenamientos completados.</p>
        </div>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDayStr(getLocalDateString(new Date()));
          }}
          className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer self-start sm:self-center shadow-sm"
        >
          Ir a Hoy
        </button>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/80 bg-zinc-50/50">
          <h3 className="text-lg font-bold text-zinc-900 tracking-wide uppercase">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-700 transition cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200/80 rounded-xl text-zinc-700 transition cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          <div className="space-y-1.5">
            {calendarData.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1.5">
                {week.map(({ date, isCurrentMonth }, dIdx) => {
                  const dateStr = getLocalDateString(date);
                  const isSelected = selectedDayStr === dateStr;
                  const isToday = getLocalDateString(new Date()) === dateStr;
                  const session = getSessionForDate(date);
                  const isCompleted = session ? !!completedWorkouts[session.id] : false;

                  return (
                    <button
                      key={dIdx}
                      onClick={() => setSelectedDayStr(dateStr)}
                      className={`aspect-square w-full rounded-lg p-1.5 flex flex-col justify-between text-left transition relative cursor-pointer select-none ${
                        !isCurrentMonth ? "opacity-30" : "opacity-100"
                      } ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-md border border-blue-600"
                          : isToday
                          ? "bg-blue-50 text-blue-600 font-bold border border-blue-300"
                          : "bg-zinc-50/80 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-900"
                      }`}
                    >
                      <span className="text-[10px] font-bold">{date.getDate()}</span>
                      <div className="flex items-center gap-0.5">
                        {session && session.category !== "descanso" && (
                          <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[session.category]}`} />
                        )}
                        {isCompleted && <CheckCircle2 className={`w-2.5 h-2.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSession && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">{selectedDayStr}</p>
          {selectedSession.category === "descanso" || !selectedTemplate ? (
            <p className="text-sm font-bold text-zinc-600">Descanso / Movilidad</p>
          ) : (
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
                {CATEGORY_LABELS[selectedTemplate.category]}
              </span>
              <h4 className="text-base font-bold text-zinc-900">{selectedTemplate.name}</h4>
              {selectedCompleted && (
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Completado · {selectedCompleted.feedback.replace("_", " ")} · RPE {selectedCompleted.rpe}/10
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
