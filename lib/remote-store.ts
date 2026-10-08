import "server-only";
import { getMongoClient } from "@/lib/mongodb";

const REMOTE_DOCUMENT_ID = "utama";
const MAX_STORED_COMMANDS = 20;

type StoredCommand = { seq: number; command: string; sentAt: Date };

export type RemoteDocument = {
  _id: string;
  seq: number;
  commands: StoredCommand[];
  screen?: { seenAt: Date; path: string };
};

async function getRemoteCollection() {
  const uri = process.env.MONGODB_REMOTE_URI ?? process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_REMOTE_URI or MONGODB_URI environment variable.");

  const databaseName = process.env.MONGODB_DB;
  if (!databaseName) throw new Error("Missing MONGODB_DB environment variable.");

  return (await getMongoClient(uri)).db(databaseName).collection<RemoteDocument>("remote");
}

export async function pushCommand(command: string) {
  const collection = await getRemoteCollection();
  const counter = await collection.findOneAndUpdate(
    { _id: REMOTE_DOCUMENT_ID },
    { $inc: { seq: 1 }, $setOnInsert: { commands: [] } },
    { upsert: true, returnDocument: "after", projection: { seq: 1 } },
  );
  if (!counter) throw new Error("Remote counter was not returned after update.");

  await collection.updateOne(
    { _id: REMOTE_DOCUMENT_ID },
    { $push: { commands: { $each: [{ seq: counter.seq, command, sentAt: new Date() }], $slice: -MAX_STORED_COMMANDS } } },
  );
  return counter.seq;
}

export async function syncScreen(path: string) {
  const collection = await getRemoteCollection();
  return collection.findOneAndUpdate(
    { _id: REMOTE_DOCUMENT_ID },
    { $set: { screen: { seenAt: new Date(), path } }, $setOnInsert: { seq: 0, commands: [] } },
    { upsert: true, returnDocument: "after" },
  );
}

export async function readRemoteState() {
  const collection = await getRemoteCollection();
  return collection.findOne({ _id: REMOTE_DOCUMENT_ID });
}
