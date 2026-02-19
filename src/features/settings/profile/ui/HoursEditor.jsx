// src/features/settings/profile/ui/HoursEditor.jsx

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function defaultWeekly() {
  return {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
}

export default function HoursEditor({ value, onChange, disabled }) {
  const hours = value || {};
  const weekly = hours.weekly || defaultWeekly();
  const alwaysOpen = !!hours.always_open;

  function update(next) {
    onChange({
      timezone:
        hours.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      always_open: false,
      weekly,
      ...next,
    });
  }

  function toggle24() {
    if (alwaysOpen) {
      update({ always_open: false, weekly: defaultWeekly() });
    } else {
      onChange({
        timezone:
          hours.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        always_open: true,
        weekly: {},
      });
    }
  }

  function setDayTime(day, field, val) {
    const current = weekly[day] || [];
    const first = current[0] || { start: "", end: "" };

    const nextWeekly = {
      ...weekly,
      [day]: [{ ...first, [field]: val }],
    };

    update({ weekly: nextWeekly });
  }

  function toggleClosed(day) {
    const nextWeekly = {
      ...weekly,
      [day]: [],
    };

    update({ weekly: nextWeekly });
  }

  if (alwaysOpen) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Business Hours</div>

          <button
            type="button"
            onClick={toggle24}
            disabled={disabled}
            className="text-xs px-3 py-1 rounded-full bg-green-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            24/7 Enabled
          </button>
        </div>

        <div className="text-sm text-zinc-400">
          This business is open 24 hours a day.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Business Hours</div>

        <button
          type="button"
          onClick={toggle24}
          disabled={disabled}
          className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Set 24/7
        </button>
      </div>

      {DAYS.map((d) => {
        const ranges = weekly[d.key] || [];
        const isClosed = ranges.length === 0;

        return (
          <div
            key={d.key}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
          >
            <div className="text-sm text-zinc-300">{d.label}</div>

            {isClosed ? (
              <div className="text-xs text-zinc-500 col-span-2">Closed</div>
            ) : (
              <>
                <input
                  type="time"
                  value={ranges[0]?.start || ""}
                  onChange={(e) => setDayTime(d.key, "start", e.target.value)}
                  disabled={disabled}
                  className="
                    rounded-xl
                    bg-white border border-zinc-300 text-black
                    px-2 py-1 text-base outline-none
                    focus:ring-2 focus:ring-violet-600
                    disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed
                  "
                />

                <input
                  type="time"
                  value={ranges[0]?.end || ""}
                  onChange={(e) => setDayTime(d.key, "end", e.target.value)}
                  disabled={disabled}
                  className="
                    rounded-xl
                    bg-white border border-zinc-300 text-black
                    px-2 py-1 text-base outline-none
                    focus:ring-2 focus:ring-violet-600
                    disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed
                  "
                />
              </>
            )}

            <button
              type="button"
              onClick={() =>
                isClosed ? setDayTime(d.key, "start", "09:00") : toggleClosed(d.key)
              }
              disabled={disabled}
              className="text-xs text-zinc-400 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isClosed ? "Set Hours" : "Closed"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
