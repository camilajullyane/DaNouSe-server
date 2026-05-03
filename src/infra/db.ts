import { RecordsDB } from "../types/DNS";

export const db: RecordsDB = {};

export function getIP(domain: string): string | null {
  return db[domain] || null;
}
