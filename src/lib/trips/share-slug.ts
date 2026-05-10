import { randomBytes } from "crypto";

export function newShareSlug(): string {
  return randomBytes(12).toString("hex");
}
