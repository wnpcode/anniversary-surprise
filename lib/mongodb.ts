import "server-only";
import { MongoClient } from "mongodb";

type MongoGlobal = typeof globalThis & {
  anniversaryMongoClients?: Map<string, Promise<MongoClient>>;
};

const mongoGlobal = globalThis as MongoGlobal;

export async function getMongoClient(
  uri = process.env.ANNIV_MONGODB_URI,
): Promise<MongoClient> {
  if (!uri) throw new Error("Missing ANNIV_MONGODB_URI environment variable.");

  const clients = (mongoGlobal.anniversaryMongoClients ??= new Map<
    string,
    Promise<MongoClient>
  >());
  let connection = clients.get(uri);

  if (!connection) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8_000,
    });

    connection = client.connect().catch((error: unknown) => {
      clients.delete(uri);
      throw error;
    });
    clients.set(uri, connection);
  }

  return connection;
}

export async function getAnniversaryDatabase() {
  const databaseName = process.env.MONGODB_DB;
  if (!databaseName)
    throw new Error("Missing MONGODB_DB environment variable.");

  return (await getMongoClient()).db(databaseName);
}

export async function getWritableDatabase() {
  const uri = process.env.MONGODB_REMOTE_URI ?? process.env.ANNIV_MONGODB_URI;
  if (!uri)
    throw new Error(
      "Missing MONGODB_REMOTE_URI or ANNIV_MONGODB_URI environment variable.",
    );

  const databaseName = process.env.MONGODB_DB;
  if (!databaseName)
    throw new Error("Missing MONGODB_DB environment variable.");

  return (await getMongoClient(uri)).db(databaseName);
}
