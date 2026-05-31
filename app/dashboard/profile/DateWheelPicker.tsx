"use client";

import { useRef, useEffect, useState } from "react";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = 2;

interface ColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (idx: number) => void;
}

function Column({ items, selectedIndex, onChange }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolling = useRef(false);
  const onChangeRef = useRef(onChange);
  const [live, setLive] = useState(selectedIndex);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!scrolling.current) {
      ref.current?.scrollTo({ top: selectedIndex * ITEM_H, behavior: "smooth" });
      setLive(selectedIndex);
    }
  }, [selectedIndex]);

  function handleScroll() {
    if (!ref.current) return;
    scrolling.current = true;
    const raw = ref.current.scrollTop / ITEM_H;
    setLive(raw);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_H)));
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      setLive(idx);
      scrolling.current = false;
      onChangeRef.current(idx);
    }, 120);
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* 상단 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[88px] bg-gradient-to-b from-white to-transparent dark:from-gray-900" />
      {/* 하단 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[88px] bg-gradient-to-t from-white to-transparent dark:from-gray-900" />
      {/* 선택 영역 표시선 */}
      <div
        className="pointer-events-none absolute inset-x-4 z-20 border-t border-gray-200 dark:border-gray-700"
        style={{ top: PAD * ITEM_H }}
      />
      <div
        className="pointer-events-none absolute inset-x-4 z-20 border-b border-gray-200 dark:border-gray-700"
        style={{ top: (PAD + 1) * ITEM_H }}
      />
      {/* 스크롤 목록 */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: VISIBLE * ITEM_H, scrollSnapType: "y mandatory" }}
      >
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`t${i}`} style={{ height: ITEM_H }} />
        ))}
        {items.map((label, i) => {
          const dist = Math.abs(i - live);
          const opacity = dist < 0.5 ? 1 : dist < 1.5 ? 0.5 : 0.2;
          const scale = dist < 0.5 ? 1 : dist < 1.5 ? 0.9 : 0.82;
          return (
            <div
              key={i}
              onClick={() => {
                ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                setLive(i);
                onChangeRef.current(i);
              }}
              style={{
                height: ITEM_H,
                scrollSnapAlign: "center",
                opacity,
                transform: `scale(${scale})`,
              }}
              className="flex cursor-pointer items-center justify-center text-sm font-semibold text-gray-800 transition-[opacity,transform] duration-100 dark:text-gray-100"
            >
              {label}
            </div>
          );
        })}
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`b${i}`} style={{ height: ITEM_H }} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function DateWheelPicker({ value, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1923 }, (_, i) => `${currentYear - i}년`);
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

  const parts = value ? value.split("-") : [];
  const yearLabel = parts[0] ? `${parseInt(parts[0], 10)}년` : `${currentYear}년`;
  const yearIdx = Math.max(0, years.indexOf(yearLabel));
  const monthIdx = parts[1] ? Math.max(0, parseInt(parts[1], 10) - 1) : 0;
  const day = (parts[2] ?? "01").padStart(2, "0");

  const yIdxRef = useRef(yearIdx);
  const mIdxRef = useRef(monthIdx);
  yIdxRef.current = yearIdx;
  mIdxRef.current = monthIdx;

  function handleYear(i: number) {
    const y = years[i].replace("년", "");
    const m = String(mIdxRef.current + 1).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  }

  function handleMonth(i: number) {
    const y = years[yIdxRef.current].replace("년", "");
    const m = String(i + 1).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  }

  return (
    <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <Column items={years} selectedIndex={yearIdx} onChange={handleYear} />
      <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800" />
      <Column items={months} selectedIndex={monthIdx} onChange={handleMonth} />
    </div>
  );
}
