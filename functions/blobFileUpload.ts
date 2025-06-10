import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";
import { v4 as uuid } from "uuid";
import { type FileInput } from "$types/FileInput";

const blobFileUpload: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const files: FileInput[] = body?.files ?? [];

  const uploads = getStore("file-uploads");
  const results = [];
  for (const file of files) {
    const key = uuid();
    await uploads.set(key, file.content, {
      metadata: {
        name: file.name,
        type: file.type,
      },
    });

    results.push(key);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results }),
  };
};

export { blobFileUpload as handler };
