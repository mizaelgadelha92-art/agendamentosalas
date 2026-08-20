import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mic2,
  BookOpen,
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import feiraoLogo from "@/imports/feirao.jpg";

type Room = "reuniao" | "auditorio";

interface Booking {
  id: string;
  room: Room;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  bookedBy: string;
  subject: string;
}

const ROOM_CONFIG = {
  reuniao: {
    label: "Sala de Reunião",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    barBg: "bg-blue-500",
    icon: Users,
    capacity: "até 10 pessoas",
  },
  auditorio: {
    label: "Auditório",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    barBg: "bg-red-500",
    icon: Mic2,
    capacity: "até 60 pessoas",
  },
};

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "1",
    room: "reuniao",
    date: formatDate(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    bookedBy: "Ana Silva",
    subject: "Alinhamento de projeto",
  },
  {
    id: "2",
    room: "auditorio",
    date: formatDate(new Date()),
    startTime: "14:00",
    endTime: "16:00",
    bookedBy: "Carlos Mendes",
    subject: "Apresentação de resultados Q3",
  },
  {
    id: "3",
    room: "reuniao",
    date: formatDate(addDays(new Date(), 1)),
    startTime: "11:00",
    endTime: "12:00",
    bookedBy: "Fernanda Costa",
    subject: "Revisão de contratos",
  },
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hasConflict(bookings: Booking[], newB: Omit<Booking, "id">, excludeId?: string): boolean {
  const start = timeToMinutes(newB.startTime);
  const end = timeToMinutes(newB.endTime);
  return bookings.some((b) => {
    if (b.id === excludeId) return false;
    if (b.room !== newB.room || b.date !== newB.date) return false;
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    return start < be && end > bs;
  });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalMonth { year: number; month: number }

function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const today = new Date();
  const [calMonth, setCalMonth] = useState<CalMonth>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [form, setForm] = useState({
    room: "reuniao" as Room,
    date: formatDate(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    bookedBy: "",
    subject: "",
  });
  const [formError, setFormError] = useState("");

  function prevMonth() {
    setCalMonth((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: c.month - 1 };
    });
  }
  function nextMonth() {
    setCalMonth((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: c.month + 1 };
    });
  }
  function prevYear() { setCalMonth((c) => ({ ...c, year: c.year - 1 })); }
  function nextYear() { setCalMonth((c) => ({ ...c, year: c.year + 1 })); }

  const calendarDays = useMemo(
    () => buildCalendarDays(calMonth.year, calMonth.month),
    [calMonth]
  );

  const todayStr = formatDate(new Date());

  const dayBookings = useMemo(() =>
    bookings
      .filter((b) => b.date === selectedDate)
      .filter((b) => !activeRoom || b.room === activeRoom)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [bookings, selectedDate, activeRoom]
  );

  function openModal(room?: Room) {
    setForm({
      room: room ?? "reuniao",
      date: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      bookedBy: "",
      subject: "",
    });
    setFormError("");
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.bookedBy.trim()) { setFormError("Informe o nome de quem está agendando."); return; }
    if (!form.subject.trim()) { setFormError("Informe o assunto da reunião."); return; }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      setFormError("O horário de término deve ser após o início."); return;
    }
    if (hasConflict(bookings, form)) {
      setFormError("Já existe um agendamento nesse horário para esta sala."); return;
    }
    setBookings((prev) => [...prev, { ...form, id: generateId() }]);
    setShowModal(false);
  }

  function handleDelete(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setDeleteConfirm(null);
  }

  const rooms: Room[] = ["reuniao", "auditorio"];

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}
    >
      {/* Sidebar + Main layout */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0" style={{ background: "var(--primary)" }}>
          {/* Brand header */}
          <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={feiraoLogo}
                alt="Feirão do Lar"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <span className="text-white font-bold text-base leading-tight block">Feirão do Lar</span>
                <span className="text-blue-200 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Agendamento de Salas
                </span>
              </div>
            </div>
          </div>

          {/* Room filters */}
          <div className="px-4 mt-5 mb-6">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest px-2 mb-3">
              Salas
            </p>
            <button
              onClick={() => setActiveRoom(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                activeRoom === null
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/8 hover:text-white"
              }`}
            >
              <BookOpen size={16} />
              Todas as salas
            </button>
            {rooms.map((room) => {
              const cfg = ROOM_CONFIG[room];
              const Icon = cfg.icon;
              return (
                <button
                  key={room}
                  onClick={() => setActiveRoom(activeRoom === room ? null : room)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                    activeRoom === room
                      ? "bg-white/15 text-white"
                      : "text-blue-200 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Room status cards */}
          <div className="px-4 mt-auto mb-8 space-y-3">
            {rooms.map((room) => {
              const cfg = ROOM_CONFIG[room];
              const todayBookings = bookings.filter(
                (b) => b.room === room && b.date === todayStr
              );
              return (
                <div key={room} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        room === "reuniao" ? "bg-blue-300" : "bg-red-400"
                      }`}
                    />
                    <span className="text-white text-xs font-semibold">{cfg.label}</span>
                  </div>
                  <p className="text-blue-200 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {todayBookings.length} agendamento{todayBookings.length !== 1 ? "s" : ""} hoje
                  </p>
                  <p className="text-blue-300 text-xs mt-0.5">{cfg.capacity}</p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <img src={feiraoLogo} alt="Feirão do Lar" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-foreground">Feirão do Lar</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="font-bold text-foreground text-xl capitalize">
                {formatDisplayDate(selectedDate)}
              </h1>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: "var(--primary)" }}
            >
              <Plus size={16} />
              <span>Novo Agendamento</span>
            </button>
          </header>

          {/* Inline Calendar */}
          <div className="bg-card border-b border-border px-5 py-4">
            {/* Month / Year navigation */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={prevYear}
                  title="Ano anterior"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={prevMonth}
                  title="Mês anterior"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
              <button
                onClick={() => setCalMonth({ year: today.getFullYear(), month: today.getMonth() })}
                className="text-sm font-bold text-foreground capitalize hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                {MONTH_NAMES[calMonth.month]} {calMonth.year}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={nextMonth}
                  title="Próximo mês"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={nextYear}
                  title="Próximo ano"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {calendarDays.map((dateStr, i) => {
                if (!dateStr) {
                  return <div key={`empty-${i}`} />;
                }
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const dayBookingsCount = bookings.filter(
                  (b) => b.date === dateStr && (!activeRoom || b.room === activeRoom)
                );
                const hasReuniao = dayBookingsCount.some((b) => b.room === "reuniao");
                const hasAuditorio = dayBookingsCount.some((b) => b.room === "auditorio");
                const [, , d] = dateStr.split("-");
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                    }}
                    className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-sm font-semibold transition-all select-none ${
                      isSelected
                        ? "text-white"
                        : isToday
                        ? "text-blue-700 bg-blue-50"
                        : "text-foreground hover:bg-muted"
                    }`}
                    style={isSelected ? { background: "var(--primary)" } : {}}
                  >
                    <span>{Number(d)}</span>
                    {/* Booking dots */}
                    {(hasReuniao || hasAuditorio) && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasReuniao && (
                          <span
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-blue-300" : "bg-blue-500"}`}
                          />
                        )}
                        {hasAuditorio && (
                          <span
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-red-300" : "bg-red-500"}`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Sala de Reunião
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Auditório
              </div>
              <button
                onClick={() => {
                  setSelectedDate(todayStr);
                  setCalMonth({ year: today.getFullYear(), month: today.getMonth() });
                }}
                className="ml-auto text-xs font-semibold text-primary hover:underline transition-colors"
              >
                Hoje
              </button>
            </div>

            <p className="text-sm font-semibold text-foreground mt-3 capitalize">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>

          {/* Room quick-add buttons */}
          <div className="px-6 pt-4 pb-2 flex gap-3 lg:hidden overflow-x-auto">
            {rooms.map((room) => {
              const cfg = ROOM_CONFIG[room];
              const Icon = cfg.icon;
              return (
                <button
                  key={room}
                  onClick={() => openModal(room)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${cfg.badgeBg} ${cfg.badgeText} transition-opacity hover:opacity-80`}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
            {dayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Calendar size={40} className="text-muted-foreground mb-4 opacity-40" />
                <p className="font-semibold text-foreground">Nenhum agendamento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum agendamento para este dia.
                  {activeRoom ? ` (${ROOM_CONFIG[activeRoom].label})` : ""}
                </p>
                <button
                  onClick={() => openModal(activeRoom ?? undefined)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)" }}
                >
                  <Plus size={14} />
                  Agendar agora
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-w-3xl">
                {dayBookings.map((booking) => {
                  const cfg = ROOM_CONFIG[booking.room];
                  const Icon = cfg.icon;
                  const duration =
                    timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
                  return (
                    <div
                      key={booking.id}
                      className={`bg-card rounded-xl border ${cfg.border} p-4 flex gap-4 group transition-shadow hover:shadow-md`}
                    >
                      {/* Time column */}
                      <div className="flex flex-col items-center shrink-0 w-14">
                        <span className="text-sm font-bold text-foreground">{booking.startTime}</span>
                        <div className={`w-0.5 flex-1 my-1 rounded-full ${cfg.barBg} opacity-30`} style={{ minHeight: "20px" }} />
                        <span className="text-xs text-muted-foreground">{booking.endTime}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${cfg.badgeBg} ${cfg.badgeText}`}
                            >
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                            <h3 className="font-bold text-foreground text-base leading-snug">
                              {booking.subject}
                            </h3>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm(booking.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div
                          className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <span className="flex items-center gap-1.5">
                            <Users size={11} />
                            {booking.bookedBy}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={11} />
                            {duration} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} />
                            {formatShortDate(booking.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            style={{ maxHeight: "90dvh", overflowY: "auto" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-bold text-foreground text-lg">Novo Agendamento</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Preencha os dados para reservar a sala
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal form */}
            <div className="px-6 py-5 space-y-5">
              {/* Room select */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Sala</label>
                <div className="grid grid-cols-2 gap-2">
                  {rooms.map((room) => {
                    const cfg = ROOM_CONFIG[room];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, room }))}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          form.room === room
                            ? `${cfg.border} ${cfg.bg} ${cfg.color}`
                            : "border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted"
                        }`}
                      >
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Calendar size={13} className="inline mr-1.5 opacity-60" />
                  Data
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Clock size={13} className="inline mr-1.5 opacity-60" />
                    Início
                  </label>
                  <select
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {HOURS.flatMap((h) =>
                      ["00", "30"].map((min) => {
                        const val = `${String(h).padStart(2, "0")}:${min}`;
                        return <option key={val} value={val}>{val}</option>;
                      })
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Clock size={13} className="inline mr-1.5 opacity-60" />
                    Término
                  </label>
                  <select
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {HOURS.flatMap((h) =>
                      ["00", "30"].map((min) => {
                        const val = `${String(h).padStart(2, "0")}:${min}`;
                        return <option key={val} value={val}>{val}</option>;
                      })
                    ).concat(
                      [<option key="20:00" value="20:00">20:00</option>]
                    )}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Users size={13} className="inline mr-1.5 opacity-60" />
                  Agendado por
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={form.bookedBy}
                  onChange={(e) => setForm((f) => ({ ...f, bookedBy: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <BookOpen size={13} className="inline mr-1.5 opacity-60" />
                  Assunto da reunião
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alinhamento semanal, Entrevista, Treinamento..."
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="font-bold text-foreground text-base mb-1">Cancelar agendamento?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta ação não pode ser desfeita. O horário será liberado para novos agendamentos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 transition-colors"
              >
                Manter
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
