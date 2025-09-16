// src/pages/api/instructions.ts
import { MongoClient, type Collection } from "mongodb";
import type { APIRoute } from "astro";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/aibox";
const client = new MongoClient(uri);

import type { Db } from "mongodb";

let db: Db;
let collection: Collection;

async function connectToDb() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE || "aibox");
    collection = db.collection("configurations");
  }
}

// GET request handler
export const GET: APIRoute = async () => {
  await connectToDb();
  const instructions = await collection.findOne({}); // Find the single document
  return new Response(JSON.stringify(instructions?.defaultInstructions || []), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// POST request handler
export const POST: APIRoute = async ({ request }) => {
  await connectToDb();
  try {
    const data = await request.json();
    await collection.updateOne(
      {}, // Filter for the single document
      { $set: { defaultInstructions: data.defaultInstructions } },
      { upsert: true }, // Creates the document if it doesn't exist
    );
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Failed to save instructions:", error);
    return new Response(JSON.stringify({ message: "Failed to save data" }), {
      status: 500,
    });
  }
};
