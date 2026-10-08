import "server-only";
import { cache } from "react";
import type { Anniversary } from "@/data/anniversaries";
import { getAnniversaryDatabase, getWritableDatabase } from "@/lib/mongodb";

async function findLatestAnniversary(): Promise<Anniversary | null> {
  const database = await getAnniversaryDatabase();
  const [document] = await database
    .collection<Anniversary>("anniversaries")
    .find({}, { projection: { _id: 0 } })
    .sort({ year: -1 })
    .limit(1)
    .toArray();

  return document ?? null;
}

async function findAnniversaryBySlug(slug: string): Promise<Anniversary | null> {
  const database = await getAnniversaryDatabase();
  const document = await database
    .collection<Anniversary>("anniversaries")
    .findOne({ slug }, { projection: { _id: 0 } });

  return document ?? null;
}

async function findAnniversaries(): Promise<Anniversary[]> {
  const database = await getAnniversaryDatabase();
  return database
    .collection<Anniversary>("anniversaries")
    .find({}, { projection: { _id: 0 } })
    .sort({ year: -1 })
    .toArray();
}

export const getLatestAnniversary = cache(findLatestAnniversary);
export const getAnniversaryBySlug = cache(findAnniversaryBySlug);
export const listAnniversaries = cache(findAnniversaries);

export async function updateAnniversaryLetter(
  slug: string,
  data: { letter: string; signoff: string },
) {
  const database = await getWritableDatabase();
  const result = await database
    .collection<Anniversary>("anniversaries")
    .updateOne({ slug }, { $set: data });

  return result.matchedCount;
}
