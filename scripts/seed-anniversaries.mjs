import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_SEED_URI;
const databaseName = process.env.MONGODB_DB;

if (!uri || !databaseName) {
  throw new Error("Set MONGODB_SEED_URI and MONGODB_DB before seeding Atlas.");
}

const seedPath = new URL("../data/anniversaries.seed.json", import.meta.url);
const initialAnniversaries = JSON.parse(await readFile(seedPath, "utf8"));
const collectionName = "anniversaries";
const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "slug", "year", "dateLabel", "eyebrow", "headlineLead", "headlineEmphasis",
      "intro", "memories", "photos", "conversationPrompt", "letter", "signoff",
    ],
    properties: {
      slug: { bsonType: "string", minLength: 1 },
      year: { bsonType: ["int", "long", "double"], minimum: 1 },
      dateLabel: { bsonType: "string" },
      eyebrow: { bsonType: "string" },
      headlineLead: { bsonType: "string" },
      headlineEmphasis: { bsonType: "string" },
      intro: { bsonType: "string" },
      memories: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["label", "copy"],
          properties: {
            label: { bsonType: "string" },
            copy: { bsonType: "string" },
          },
        },
      },
      photos: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["src", "alt"],
          properties: {
            src: { bsonType: "string" },
            alt: { bsonType: "string" },
            caption: { bsonType: "string" },
          },
        },
      },
      conversationPrompt: { bsonType: "string" },
      letter: { bsonType: "string" },
      signoff: { bsonType: "string" },
    },
  },
};

const client = new MongoClient(uri, { maxPoolSize: 2 });

try {
  await client.connect();
  const database = client.db(databaseName);
  const collectionExists = await database.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();

  if (collectionExists) {
    await database.command({
      collMod: collectionName,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await database.createCollection(collectionName, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  const anniversaries = database.collection(collectionName);
  await anniversaries.createIndex({ slug: 1 }, { unique: true, name: "unique_anniversary_slug" });
  await anniversaries.createIndex({ year: 1 }, { unique: true, name: "unique_anniversary_year" });
  await anniversaries.bulkWrite(initialAnniversaries.map((anniversary) => ({
    updateOne: {
      filter: { slug: anniversary.slug },
      update: { $setOnInsert: anniversary },
      upsert: true,
    },
  })));

  console.info("Anniversary collection validated, indexed, and seeded without overwriting existing records.");
} catch {
  console.error("Atlas setup failed. Check the connection string, database user permissions, and network access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
