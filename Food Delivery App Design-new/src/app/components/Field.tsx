/** The one text input used across every form in the app. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-white/50">{label}</span>
      <input
        value={value}
        inputMode={numeric ? "numeric" : "text"}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-white placeholder:text-white/25 outline-none transition-colors duration-300 focus:border-white/35"
      />
    </label>
  );
}
