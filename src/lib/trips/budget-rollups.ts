export type TripExpenseCategory = "transport" | "stay" | "meals" | "activities" | "other";

export const EXPENSE_CATEGORY_LABELS: Record<TripExpenseCategory, string> = {
  transport: "Transport",
  stay: "Stay",
  meals: "Meals",
  activities: "Activities",
  other: "Other",
};

/** Inclusive calendar days between ISO date strings yyyy-MM-dd; minimum 1. */
export function tripInclusiveDayCount(startIso: string, endIso: string): number {
  const a = new Date(`${startIso.trim().slice(0, 10)}T12:00:00.000Z`);
  const b = new Date(`${endIso.trim().slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diffMs = b.getTime() - a.getTime();
  const days = Math.floor(diffMs / 86400000) + 1;
  return Math.max(1, days);
}

export type BudgetRollup = {
  /** Sum of trip_activities.cost across all stops */
  activityCostsTotal: number;
  /** Extra “activities” rows from trip_expenses */
  expenseActivitiesTotal: number;
  transport: number;
  stay: number;
  meals: number;
  other: number;
  /** activityCostsTotal + expenseActivitiesTotal */
  activitiesCombined: number;
  grandTotal: number;
  dailyAverage: number;
  tripDays: number;
};

export function computeBudgetRollup(input: {
  activityCostsTotal: number;
  expenses: { category: TripExpenseCategory; amount: number }[];
  tripDays: number;
}): BudgetRollup {
  let transport = 0;
  let stay = 0;
  let meals = 0;
  let expenseActivities = 0;
  let other = 0;
  for (const e of input.expenses) {
    const n = Number.isFinite(e.amount) ? e.amount : 0;
    switch (e.category) {
      case "transport":
        transport += n;
        break;
      case "stay":
        stay += n;
        break;
      case "meals":
        meals += n;
        break;
      case "activities":
        expenseActivities += n;
        break;
      default:
        other += n;
    }
  }
  const activityCostsTotal = Math.max(0, input.activityCostsTotal);
  const activitiesCombined = activityCostsTotal + expenseActivities;
  const grandTotal = activitiesCombined + transport + stay + meals + other;
  const days = Math.max(1, input.tripDays);
  return {
    activityCostsTotal,
    expenseActivitiesTotal: expenseActivities,
    transport,
    stay,
    meals,
    other,
    activitiesCombined,
    grandTotal,
    dailyAverage: grandTotal / days,
    tripDays: days,
  };
}

export type BudgetBreakdownRow = { key: string; label: string; amount: number };

export function breakdownRows(r: BudgetRollup): BudgetBreakdownRow[] {
  const rows: BudgetBreakdownRow[] = [
    { key: "activities", label: "Activities", amount: r.activitiesCombined },
    { key: "transport", label: EXPENSE_CATEGORY_LABELS.transport, amount: r.transport },
    { key: "stay", label: EXPENSE_CATEGORY_LABELS.stay, amount: r.stay },
    { key: "meals", label: EXPENSE_CATEGORY_LABELS.meals, amount: r.meals },
    { key: "other", label: EXPENSE_CATEGORY_LABELS.other, amount: r.other },
  ];
  return rows.filter((x) => x.amount >= 0.005);
}
