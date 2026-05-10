import { getNames } from "i18n-iso-countries";

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
