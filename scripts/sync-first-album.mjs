import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_SEED_URI;
const databaseName = process.env.MONGODB_DB;

if (!uri || !databaseName) {
  throw new Error("Set MONGODB_SEED_URI and MONGODB_DB before updating Atlas.");
}

const seedPath = new URL("../data/anniversaries.seed.json", import.meta.url);
const [anniversary] = JSON.parse(await readFile(seedPath, "utf8"));
const collectionName = "anniversaries";
const client = new MongoClient(uri, { maxPoolSize: 2 });

try {
  await client.connect();
  const collection = client.db(databaseName).collection(collectionName);
  const exists = await collection.findOne({ slug: "pertama" }, { projection: { _id: 1 } });

  if (!exists) {
    throw new Error("Anniversary dengan slug 'pertama' tidak ditemukan di Atlas.");
  }

  const photos = [...anniversary.photos].sort((a, b) => {
    const number = (src) => Number(src.split("/").pop().match(/^(\d+)/)?.[1] ?? 0);
    return number(a.src) - number(b.src);
  });
  const result = await collection.bulkWrite(photos.map((photo) => ({
    updateOne: {
      filter: {
        slug: "pertama",
        photos: { $not: { $elemMatch: { src: photo.src } } },
      },
      update: { $push: { photos: photo } },
    },
  })), { ordered: false });

  console.info(`Album tersinkron: ${result.modifiedCount} foto baru ditambahkan dari ${photos.length} foto.`);
} catch (error) {
  console.error("Sinkronisasi Atlas gagal. Periksa URI, hak akses user database, dan network access list.");
  console.error(`Penyebab: ${error.codeName ?? error.name}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
