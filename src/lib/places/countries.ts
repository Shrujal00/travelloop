import enLocale from "i18n-iso-countries/langs/en.json";
import { getNames, registerLocale } from "i18n-iso-countries";

/** v7+ requires registering locale data before getNames("en") returns anything. */
registerLocale(enLocale);

export type CountryOption = { code: string; name: string };

/** ISO 3166-1 alpha-2 + English display name, sorted by name. */
export function getCountryOptions(): CountryOption[] {
  const names = getNames("en", { select: "official" }) as Record<string, string>;
  return Object.entries(names)
    .map(([code, name]) => ({ code: code.toUpperCase(), name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isValidIso3166Alpha2(code: string): boolean {
  if (!/^[A-Za-z]{2}$/.test(code)) return false;
  const names = getNames("en", { select: "official" }) as Record<string, string>;
  return Boolean(names[code.toUpperCase()]);
}

/** English official country name for ISO alpha-2, or null when unknown / unset. */
export function englishOfficialCountryName(code: string | null | undefined): string | null {
  const c = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!c || !isValidIso3166Alpha2(c)) return null;
  const names = getNames("en", { select: "official" }) as Record<string, string>;
  return names[c] ?? null;
}
