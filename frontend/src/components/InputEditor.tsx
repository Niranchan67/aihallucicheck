import { ClipboardPaste, Eraser, Sparkles } from "lucide-react";

const EXAMPLE_TEXT =
  "Paris is the capital of France. The Moon is a planet. Marie Curie won three Nobel Prizes. " +
  "The Eiffel Tower grows about 15cm taller in summer due to thermal expansion.";

interface InputEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxChars: number;
  disabled?: boolean;
}

export function InputEditor({ value, onChange, maxChars, disabled }: InputEditorProps) {
  const overLimit = value.length > maxChars;

  async function handlePaste() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onChange(clipboardText);
    } catch {
      // Clipboard permission denied or unavailable -- the textarea itself
      // still accepts a manual paste, so this is a soft failure.
    }
  }

  return (
    <div className="rounded border border-hairline bg-white">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="text-sm text-ink-soft">Content to verify</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:opacity-40"
          >
            <ClipboardPaste size={15} strokeWidth={1.75} />
            Paste
          </button>
          <button
            type="button"
            onClick={() => onChange(EXAMPLE_TEXT)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:opacity-40"
          >
            <Sparkles size={15} strokeWidth={1.75} />
            Try an example
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled || value.length === 0}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:opacity-40"
          >
            <Eraser size={15} strokeWidth={1.75} />
            Clear
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste text produced by ChatGPT, Claude, Gemini, or any other model…"
        rows={10}
        className="w-full resize-y bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-soft/60 focus:outline-none disabled:opacity-60"
      />

      <div className="flex items-center justify-between border-t border-hairline px-4 py-2 font-mono text-xs">
        <span className={overLimit ? "text-hallucinated" : "text-ink-soft"}>
          {value.length.toLocaleString()} / {maxChars.toLocaleString()} characters
        </span>
        {overLimit && <span className="text-hallucinated">Over the limit — trim before analyzing.</span>}
      </div>
    </div>
  );
}
