import type { OpeningHours } from "@/lib/validations";

const DAY_KEYS: (keyof OpeningHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function isOpenNow(openingHours: unknown, now: Date = new Date()): boolean {
  const hours = openingHours as OpeningHours | null;
  if (!hours) return false;

  const dayKey = DAY_KEYS[now.getDay()];
  const day = hours[dayKey];
  if (!day || day.closed || !day.open || !day.close) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = day.open.split(":").map(Number);
  const [closeH, closeM] = day.close.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
