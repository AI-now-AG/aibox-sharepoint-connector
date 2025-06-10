import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";
import { v4 as uuid } from "uuid";
import { type FileInput } from "$types/FileInput";
import { NETLIFY_BLOBS_STORE } from "$constants";

const blobFileUpload: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const files: FileInput[] = body?.files ?? [];

  const store = getStore({
    name: NETLIFY_BLOBS_STORE,
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
  const results = [];
  for (const file of files) {
    const key = uuid();
    await store.setJSON(key, file);
    results.push(key);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results }),
  };
};

export { blobFileUpload as handler };
