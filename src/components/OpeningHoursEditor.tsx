"use client";

import type { OpeningHours } from "@/lib/validations";

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export const DEFAULT_OPENING_HOURS: OpeningHours = DAYS.reduce((acc, { key }) => {
  acc[key] = { closed: false, open: "09:00", close: "18:00" };
  return acc;
}, {} as OpeningHours);

export default function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        return (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          >
            <label className="flex w-32 items-center gap-2.5">
              <input
                type="checkbox"
                checked={!day.closed}
                onChange={(e) =>
                  onChange({ ...value, [key]: { ...day, closed: !e.target.checked } })
                }
                className="h-4 w-4 accent-orange-600"
              />
              {label}
            </label>
            {!day.closed ? (
              <>
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => onChange({ ...value, [key]: { ...day, open: e.target.value } })}
                  className="field w-auto py-1.5"
                />
                <span className="text-zinc-400">to</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) =>
                    onChange({ ...value, [key]: { ...day, close: e.target.value } })
                  }
                  className="field w-auto py-1.5"
                />
              </>
            ) : (
              <span className="text-zinc-400">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
