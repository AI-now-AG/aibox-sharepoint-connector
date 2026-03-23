function integrationFetch(
  baseUrl: string,
  path: string,
  apiToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...options.headers,
    },
  });
}

// --- Connections ---

export async function listConnections(baseUrl: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, "/api/connections", apiToken);
  return res.json();
}

export async function deleteConnection(baseUrl: string, id: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, `/api/connections/${id}`, apiToken, {
    method: "DELETE",
  });
  return res.json();
}

export async function testConnection(baseUrl: string, id: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, `/api/connections/${id}/test`, apiToken, {
    method: "POST",
  });
  return res.json();
}

// --- Sync Jobs ---

export async function listSyncJobs(baseUrl: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, "/api/sync-jobs", apiToken);
  return res.json();
}

export async function createSyncJob(
  baseUrl: string,
  data: {
    connection_id: string;
    remote_folder_id: string;
    remote_folder_path?: string;
    aibox_folder_id: string;
    polling_interval_minutes?: number;
  },
  apiToken: string
) {
  const res = await integrationFetch(baseUrl, "/api/sync-jobs", apiToken, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ...json, status: res.status };
}

export async function updateSyncJob(
  baseUrl: string,
  id: string,
  data: { status?: "active" | "paused"; polling_interval_minutes?: number },
  apiToken: string
) {
  const res = await integrationFetch(baseUrl, `/api/sync-jobs/${id}`, apiToken, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSyncJob(baseUrl: string, id: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, `/api/sync-jobs/${id}`, apiToken, {
    method: "DELETE",
  });
  return res.json();
}

export async function triggerSync(baseUrl: string, id: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, `/api/sync-jobs/${id}/trigger`, apiToken, {
    method: "POST",
  });
  return res.json();
}

// --- Remote Folders ---

export async function listRemoteFolders(
  baseUrl: string,
  connectionId: string,
  parentId: string | undefined,
  apiToken: string
) {
  const params = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
  const res = await integrationFetch(
    baseUrl,
    `/api/remote-folders/${connectionId}${params}`,
    apiToken
  );
  return res.json();
}

// --- Admin ---

export async function getIntegrationSettings(baseUrl: string, apiToken: string) {
  const res = await integrationFetch(baseUrl, "/api/admin/integrations", apiToken);
  return res.json();
}

export async function updateIntegrationSettings(
  baseUrl: string,
  data: {
    enabled_providers?: string[];
    enabled_capabilities?: string[];
    default_polling_interval_minutes?: number;
    min_polling_interval_minutes?: number;
  },
  apiToken: string
) {
  const res = await integrationFetch(baseUrl, "/api/admin/integrations", apiToken, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

// --- OAuth ---

export function getOAuthStartUrl(baseUrl: string, apiToken: string): string {
  return `${baseUrl}/api/oauth/microsoft/start?token=${encodeURIComponent(apiToken)}`;
}
