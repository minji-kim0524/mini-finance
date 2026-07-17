interface CompareSelectorProps {
  reports: { id: string; name: string; created_at: string }[];
  value: string;
  onChange: (id: string) => void;
  loading: boolean;
}

export default function CompareSelector({ reports, value, onChange, loading }: CompareSelectorProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
      <span className="shrink-0 text-xs font-semibold text-blue-600">전기 비교</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
      >
        <option value="">비교 안 함</option>
        {reports.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      {loading && (
        <svg className="h-4 w-4 shrink-0 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  );
}