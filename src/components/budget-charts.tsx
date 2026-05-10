"use client";

import type { BudgetBreakdownRow } from "@/lib/trips/budget-rollups";

/** Matches breakdown row keys from `breakdownRows`. */
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  activities: "#0d9488",
  transport: "#2563eb",
  stay: "#7c3aed",
  meals: "#ea580c",
  other: "#78716c",
};

function annularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number
): string {
  const x1 = cx + rOuter * Math.cos(a0);
  const y1 = cy + rOuter * Math.sin(a0);
  const x2 = cx + rOuter * Math.cos(a1);
  const y2 = cy + rOuter * Math.sin(a1);
  const x3 = cx + rInner * Math.cos(a1);
  const y3 = cy + rInner * Math.sin(a1);
  const x4 = cx + rInner * Math.cos(a0);
  const y4 = cy + rInner * Math.sin(a0);
  const large = Math.abs(a1 - a0) <= Math.PI ? 0 : 1;
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

/** Donut chart: share of total spend by category (problem-statement pie visualization). */
export function BudgetCategoryPieChart({
  breakdown,
  grandTotal,
  labelledById,
}: {
  breakdown: BudgetBreakdownRow[];
  grandTotal: number;
  labelledById: string;
}) {
  const total = Math.max(0, grandTotal);
  const cx = 80;
  const cy = 80;
  const rOuter = 72;
  const rInner = 42;

  if (breakdown.length === 0 || total < 0.005) {
    return (
      <figure className="flex flex-col items-center gap-3">
        <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden>
          <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="#f5f5f4" />
        </svg>
        <figcaption id={labelledById} className="sr-only">
          No category data for pie chart.
        </figcaption>
      </figure>
    );
  }

  const slices = breakdown.map((row, index) => {
    const sumBefore = breakdown.slice(0, index).reduce((s, r) => s + r.amount, 0);
    const frac = row.amount / total;
    const a0 = -Math.PI / 2 + (sumBefore / total) * 2 * Math.PI;
    let a1 = -Math.PI / 2 + ((sumBefore + row.amount) / total) * 2 * Math.PI;
    if (index === breakdown.length - 1) {
      a1 = (3 * Math.PI) / 2;
    }
    const path =
      frac < 0.001 ? "" : annularSectorPath(cx, cy, rInner, rOuter, a0, a1);
    return { row, path, color: CATEGORY_CHART_COLORS[row.key] ?? "#78716c" };
  });

  return (
    <figure className="flex flex-col items-center gap-3">
      <svg
        width={160}
        height={160}
        viewBox="0 0 160 160"
        role="img"
        aria-labelledby={labelledById}
      >
        <title id={labelledById}>Spend share by category</title>
        {slices.map(({ row, path, color }) =>
          path ? <path key={row.key} d={path} fill={color} stroke="#fafaf9" strokeWidth={1} /> : null
        )}
      </svg>
    </figure>
  );
}

/** Horizontal bars: each category as percent of total (bar-chart visualization). */
export function BudgetCategoryPercentBars({
  breakdown,
  grandTotal,
}: {
  breakdown: BudgetBreakdownRow[];
  grandTotal: number;
}) {
  const total = Math.max(0, grandTotal);
  return (
    <ul className="space-y-4" aria-label="Spend by category as percent of total">
      {breakdown.length === 0 || total < 0.005 ? (
        <li className="text-sm text-stone-600">No data for chart.</li>
      ) : (
        breakdown.map((row) => {
          const pct = Math.min(100, Math.round((row.amount / total) * 1000) / 10);
          const color = CATEGORY_CHART_COLORS[row.key] ?? "#78716c";
          return (
            <li key={row.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-800">{row.label}</span>
                <span className="tabular-nums text-stone-700">{pct}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}
