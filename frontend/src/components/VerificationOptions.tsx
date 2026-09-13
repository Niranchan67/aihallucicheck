import type { AiModel } from "../types";

const MODELS: { value: AiModel; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "other", label: "Other" },
];

interface Options {
  model: AiModel;
  verifyClaims: boolean;
  verifyCitations: boolean;
  verifyStatistics: boolean;
}

interface VerificationOptionsProps {
  options: Options;
  onChange: (options: Options) => void;
  disabled?: boolean;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded border border-hairline bg-white px-3.5 py-3 transition-colors hover:border-ink-soft/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-verified"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

export function VerificationOptions({ options, onChange, disabled }: VerificationOptionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <span className="mb-2 block text-sm text-ink-soft">Source model</span>
        <div className="flex flex-wrap gap-1.5">
          {MODELS.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...options, model: m.value })}
              className={`rounded border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                options.model === m.value
                  ? "border-verified bg-verified text-white"
                  : "border-hairline bg-white text-ink-soft hover:border-ink-soft/40"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:col-span-2">
        <Toggle
          label="Factual claims"
          hint="Check statements against evidence"
          checked={options.verifyClaims}
          disabled={disabled}
          onChange={(checked) => onChange({ ...options, verifyClaims: checked })}
        />
        <Toggle
          label="Citations"
          hint="Confirm references actually exist"
          checked={options.verifyCitations}
          disabled={disabled}
          onChange={(checked) => onChange({ ...options, verifyCitations: checked })}
        />
        <Toggle
          label="Statistics"
          hint="Extra scrutiny on numeric claims"
          checked={options.verifyStatistics}
          disabled={disabled}
          onChange={(checked) => onChange({ ...options, verifyStatistics: checked })}
        />
      </div>
    </div>
  );
}
