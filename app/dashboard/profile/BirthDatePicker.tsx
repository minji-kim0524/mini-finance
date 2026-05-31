"use client";

import { useState, useRef, useEffect } from "react";

// ── Wheel column ──────────────────────────────────────────────────────────

const ITEM_H = 44;
const PAD = 2;
const VISIBLE = 5;

interface ColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (idx: number) => void;
}

function WheelColumn({ items, selectedIndex, onChange }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolling = useRef(false);
  const cbRef = useRef(onChange);
  const [live, setLive] = useState(selectedIndex);

  cbRef.current = onChange;

  useEffect(() => {
    if (!scrolling.current) {
      ref.current?.scrollTo({ top: selectedIndex * ITEM_H, behavior: "smooth" });
      setLive(selectedIndex);
    }
  }, [selectedIndex]);

  function handleScroll() {
    if (!ref.current) return;
    scrolling.current = true;
    setLive(ref.current.scrollTop / ITEM_H);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_H)));
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      setLive(idx);
      scrolling.current = false;
      cbRef.current(idx);
    }, 120);
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[88px] bg-gradient-to-b from-white to-transparent dark:from-gray-900" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[88px] bg-gradient-to-t from-white to-transparent dark:from-gray-900" />
      <div className="pointer-events-none absolute inset-x-4 z-20 border-t border-gray-200 dark:border-gray-700" style={{ top: PAD * ITEM_H }} />
      <div className="pointer-events-none absolute inset-x-4 z-20 border-b border-gray-200 dark:border-gray-700" style={{ top: (PAD + 1) * ITEM_H }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: VISIBLE * ITEM_H, scrollSnapType: "y mandatory" }}
      >
        {Array.from({ length: PAD }, (_, i) => <div key={`t${i}`} style={{ height: ITEM_H }} />)}
        {items.map((label, i) => {
          const dist = Math.abs(i - live);
          return (
            <div
              key={i}
              onClick={() => {
                ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                setLive(i);
                cbRef.current(i);
              }}
              style={{
                height: ITEM_H,
                scrollSnapAlign: "center",
                opacity: dist < 0.5 ? 1 : dist < 1.5 ? 0.5 : 0.2,
                transform: `scale(${dist < 0.5 ? 1 : dist < 1.5 ? 0.9 : 0.82})`,
              }}
              className="flex cursor-pointer items-center justify-center text-sm font-semibold text-gray-800 transition-[opacity,transform] duration-100 dark:text-gray-100"
            >
              {label}
            </div>
          );
        })}
        {Array.from({ length: PAD }, (_, i) => <div key={`b${i}`} style={{ height: ITEM_H }} />)}
      </div>
    </div>
  );
}

// ── Calendar helpers ──────────────────────────────────────────────────────

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalDay { day: number; month: number; year: number; current: boolean }

function BuildCalendar(year: number, month: number): CalDay[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;
  const days: CalDay[] = [];
  for (let i = firstDow - 1; i >= 0; i--)
    days.push({ day: daysInPrev - i, month: prevM, year: prevY, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    days.push({ day: d, month, year, current: true });
  let nd = 1;
  while (days.length < 42)
    days.push({ day: nd++, month: nextM, year: nextY, current: false });
  return days;
}

// ── Main BirthDatePicker ──────────────────────────────────────────────────

interface Props {
  value: string;       // "YYYY-MM-DD" or ""
  onConfirm: (v: string) => void;
  loading?: boolean;
}

export default function BirthDatePicker({ value, onConfirm, loading }: Props) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const initY = value ? parseInt(value.split("-")[0], 10) : todayY;
  const initM = value ? parseInt(value.split("-")[1], 10) : todayM;
  const initD = value ? parseInt(value.split("-")[2], 10) : todayD;

  const [viewY, setViewY] = useState(initY);
  const [viewM, setViewM] = useState(initM);
  const [selY, setSelY] = useState(initY);
  const [selM, setSelM] = useState(initM);
  const [selD, setSelD] = useState(initD);
  const [mode, setMode] = useState<"calendar" | "wheel">("calendar");

  const currYear = new Date().getFullYear();
  const years = Array.from({ length: currYear - 1923 }, (_, i) => `${currYear - i}년`);
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
  const [wYIdx, setWYIdx] = useState(Math.max(0, years.indexOf(`${viewY}년`)));
  const [wMIdx, setWMIdx] = useState(viewM - 1);

  // Sync wheel indices when opening wheel mode
  useEffect(() => {
    if (mode === "wheel") {
      setWYIdx(Math.max(0, years.indexOf(`${viewY}년`)));
      setWMIdx(viewM - 1);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function PrevMonth() {
    if (viewM === 1) { setViewY(y => y - 1); setViewM(12); }
    else setViewM(m => m - 1);
  }

  function NextMonth() {
    if (viewY >= todayY && viewM >= todayM) return;
    if (viewM === 12) { setViewY(y => y + 1); setViewM(1); }
    else setViewM(m => m + 1);
  }

  function SelectDay(cell: CalDay) {
    if (!cell.current) return;
    if (new Date(cell.year, cell.month - 1, cell.day) > today) return;
    setSelY(cell.year);
    setSelM(cell.month);
    setSelD(cell.day);
  }

  function ApplyWheel() {
    const y = parseInt(years[wYIdx].replace("년", ""), 10);
    const m = wMIdx + 1;
    setViewY(y);
    setViewM(m);
    setMode("calendar");
  }

  function Confirm() {
    onConfirm(`${selY}-${String(selM).padStart(2, "0")}-${String(selD).padStart(2, "0")}`);
  }

  // ── Wheel view ────────────────────────────────────────────────────────

  if (mode === "wheel") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={() => setMode("calendar")}
            className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            달력으로
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">연도 / 월 선택</span>
          <div className="w-16" />
        </div>
        <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <WheelColumn items={years} selectedIndex={wYIdx} onChange={setWYIdx} />
          <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800" />
          <WheelColumn items={months} selectedIndex={wMIdx} onChange={setWMIdx} />
        </div>
        <button
          type="button"
          onClick={ApplyWheel}
          className="mt-3 w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          완료
        </button>
      </div>
    );
  }

  // ── Calendar view ─────────────────────────────────────────────────────

  const calDays = BuildCalendar(viewY, viewM);
  const atMaxMonth = viewY >= todayY && viewM >= todayM;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={PrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => setMode("wheel")}
            className="rounded-lg px-2 py-1 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            {viewY}년
          </button>
          <button
            type="button"
            onClick={() => setMode("wheel")}
            className="rounded-lg px-2 py-1 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            {viewM}월
          </button>
        </div>
        <button
          type="button"
          onClick={NextMonth}
          disabled={atMaxMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-center text-xs font-semibold ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {calDays.map((cell, i) => {
          const isSel = cell.current && cell.year === selY && cell.month === selM && cell.day === selD;
          const isToday = cell.year === todayY && cell.month === todayM && cell.day === todayD;
          const isFuture = new Date(cell.year, cell.month - 1, cell.day) > today;
          const col = i % 7;
          return (
            <div key={i} className="flex h-9 items-center justify-center">
              <button
                type="button"
                onClick={() => SelectDay(cell)}
                disabled={!cell.current || isFuture}
                className={[
                  "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition",
                  isSel
                    ? "bg-green-500 text-white"
                    : !cell.current || isFuture
                      ? "cursor-default text-gray-300 dark:text-gray-600"
                      : col === 0
                        ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : col === 6
                          ? "text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                ].join(" ")}
              >
                {cell.day}
                {isToday && !isSel && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-green-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={Confirm}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
      >
        {loading ? "저장 중…" : "확인"}
      </button>
    </div>
  );
}
