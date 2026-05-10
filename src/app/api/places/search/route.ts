import { getVerifiedSession } from "@/lib/auth/session";
import { isValidIso3166Alpha2 } from "@/lib/places/countries";
import { searchPlacesPhoton } from "@/lib/places/photon-search";

export async function GET(req: Request) {
  const session = await getVerifiedSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const countryRaw = (searchParams.get("country") ?? "").trim().toUpperCase();
  const country =
    countryRaw && isValidIso3166Alpha2(countryRaw) ? countryRaw : null;

  if (q.length < 2) {
    return Response.json({ results: [] });
  }
  if (q.length > 120) {
    return Response.json({ error: "Query too long" }, { status: 400 });
  }

  const results = await searchPlacesPhoton(q, country, 12);
  return Response.json({ results });
}
