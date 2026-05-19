export function FormatKRW(n: number) {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return n.toLocaleString("ko-KR") + "원";
}

export function FormatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function TooltipFmt(v: unknown) {
  return typeof v === "number" ? v.toLocaleString("ko-KR") + "원" : String(v);
}
