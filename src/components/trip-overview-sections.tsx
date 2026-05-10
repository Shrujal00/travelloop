type ActivityRow = {
  id: string;
  title: string;
  cost: number | null;
  starts_at: string | null;
};

export type OverviewStopRow = {
  id: string;
  sort_order: number;
  city_name: string;
  start_date: string | null;
  end_date: string | null;
  activities: ActivityRow[];
};

function dateOnly(raw: string | null): string {
  if (!raw) return "—";
  const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : String(raw).slice(0, 10);
}

function sumCosts(activities: ActivityRow[]): number {
  return activities.reduce((acc, a) => {
    const c = a.cost;
    const n = typeof c === "number" ? c : typeof c === "string" ? Number(c) : NaN;
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function TripOverviewSections({ stops }: { stops: OverviewStopRow[] }) {
  if (stops.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-5 py-8 text-center text-sm text-stone-600">
        No itinerary sections yet.{" "}
        <span className="font-medium text-stone-800">Open Itinerary builder</span> to add stops.
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">Itinerary sections</h2>
      <p className="mt-1 text-sm text-stone-600">
        Each stop is a leg of your trip — expand to see activities you added in the builder.
      </p>
      <ol className="mt-4 space-y-3">
        {stops.map((s, i) => {
          const budget = sumCosts(s.activities);
          return (
            <li key={s.id}>
              <details className="group rounded-2xl border border-stone-200 bg-white shadow-sm open:shadow-md">
                <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                      Section {i + 1}
                    </p>
                    <p className="mt-0.5 font-semibold text-stone-900">{s.city_name}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {dateOnly(s.start_date)} → {dateOnly(s.end_date)}
                    </span>
                    <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {budget > 0 ? `$${budget.toFixed(2)}` : "No costs yet"}
                    </span>
                    <span className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-500 group-open:border-[var(--travel-accent)]/40 group-open:text-stone-800">
                      Details
                    </span>
                  </div>
                </summary>
                <div className="border-t border-stone-100 px-4 py-3">
                  {s.activities.length === 0 ? (
                    <p className="text-sm text-stone-500">No activities for this section.</p>
                  ) : (
                    <ul className="space-y-2">
                      {s.activities.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-stone-800">{a.title}</span>
                          <span className="text-xs text-stone-500">
                            {a.starts_at
                              ? new Date(a.starts_at).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Time TBD"}
                            {a.cost != null && Number.isFinite(Number(a.cost)) ? (
                              <span className="ml-2 font-medium text-stone-700">
                                ${Number(a.cost).toFixed(2)}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
