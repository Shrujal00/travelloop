/**
 * Builds a Google web search URL for a POI, appending the stop's country when known,
 * otherwise the stop city name to reduce ambiguous matches.
 */
export function googlePlaceSearchUrl(placeName: string, opts: { countryLabel: string | null; localityFallback: string }): string {
  const parts: string[] = [placeName.trim()];
  const country = opts.countryLabel?.trim();
  const locality = opts.localityFallback?.trim();
  if (country) parts.push(country);
  else if (locality) parts.push(locality);
  const q = parts.filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
