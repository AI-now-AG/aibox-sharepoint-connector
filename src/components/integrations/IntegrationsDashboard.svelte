<script lang="ts">
  import { onMount } from "svelte";
  import {
    listConnections,
    deleteConnection,
    testConnection,
    listSyncJobs,
    deleteSyncJob,
    triggerSync,
    updateSyncJob,
    getOAuthStartUrl,
  } from "$api/integration/integration-api";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    apiToken: string;
    integrationApiUrl: string;
  }

  let { apiToken, integrationApiUrl }: Props = $props();

  // State
  let loading = $state(true);
  let connections = $state<any[]>([]);
  let syncJobs = $state<any[]>([]);
  let error = $state<string | null>(null);
  let statusMessage = $state<string | null>(null);

  onMount(async () => {
    // Check URL params for status from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const provider = params.get("provider");
    const message = params.get("message");

    if (status === "connected" && provider) {
      statusMessage = `Successfully connected ${provider}`;
      // Clean URL
      window.history.replaceState({}, "", "/integrations");
    } else if (status === "error" && message) {
      error = message;
      window.history.replaceState({}, "", "/integrations");
    }

    await loadData();
  });

  async function loadData(retryCount = 0) {
    loading = true;
    error = null;
    try {
      const [connRes, jobRes] = await Promise.all([
        listConnections(integrationApiUrl, apiToken).catch((e: Error) => ({ success: false, data: [], _networkError: true, _status: 0 })),
        listSyncJobs(integrationApiUrl, apiToken).catch((e: Error) => ({ success: false, data: [], _networkError: true, _status: 0 })),
      ]);

      connections = connRes.success ? connRes.data : [];
      syncJobs = jobRes.success ? jobRes.data : [];

      if (!connRes.success || !jobRes.success) {
        const isNetworkError = (connRes as any)._networkError || (jobRes as any)._networkError;

        // Auto-retry once on network errors (service may be starting up)
        if (isNetworkError && retryCount < 2) {
          await new Promise(r => setTimeout(r, 2000));
          return loadData(retryCount + 1);
        }

        error = isNetworkError
          ? "Integration service is currently unavailable. Please try again."
          : "Could not load integration data. Please log out and log back in to refresh your session.";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function handleConnect() {
    try {
      const url = await getOAuthStartUrl(integrationApiUrl, apiToken);
      window.location.href = url;
    } catch (e) {
      error = "Failed to start connection: " + (e as Error).message;
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm("Are you sure you want to disconnect this account? All sync jobs will be removed.")) return;
    try {
      await deleteConnection(integrationApiUrl, id, apiToken);
      await loadData();
      statusMessage = "Connection removed";
    } catch (e) {
      error = "Failed to disconnect: " + (e as Error).message;
    }
  }

  async function handleTestConnection(id: string) {
    try {
      const result = await testConnection(integrationApiUrl, id, apiToken);
      if (result.data?.valid) {
        statusMessage = "Connection is working";
      } else {
        error = "Connection test failed: " + (result.data?.error || "Unknown error");
      }
    } catch (e) {
      error = "Test failed: " + (e as Error).message;
    }
  }

  async function handleTriggerSync(jobId: string) {
    try {
      await triggerSync(integrationApiUrl, jobId, apiToken);
      statusMessage = "Sync triggered";
    } catch (e) {
      error = "Failed to trigger sync: " + (e as Error).message;
    }
  }

  async function handleTogglePause(job: any) {
    const newStatus = job.status === "active" ? "paused" : "active";
    try {
      await updateSyncJob(integrationApiUrl, job._id, { status: newStatus }, apiToken);
      await loadData();
    } catch (e) {
      error = "Failed to update sync job: " + (e as Error).message;
    }
  }

  async function handleDeleteSyncJob(jobId: string) {
    if (!confirm("Delete this sync job?")) return;
    try {
      await deleteSyncJob(integrationApiUrl, jobId, apiToken);
      await loadData();
    } catch (e) {
      error = "Failed to delete sync job: " + (e as Error).message;
    }
  }

  const intervalOptions = [
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hr" },
    { value: 120, label: "2 hr" },
    { value: 360, label: "6 hr" },
    { value: 720, label: "12 hr" },
    { value: 1440, label: "24 hr" },
  ];

  async function handleIntervalChange(jobId: string, minutes: number) {
    try {
      await updateSyncJob(integrationApiUrl, jobId, { polling_interval_minutes: minutes }, apiToken);
      await loadData();
    } catch (e) {
      error = "Failed to update interval: " + (e as Error).message;
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "badge-success";
      case "paused":
        return "badge-warning";
      case "error":
        return "badge-error";
      case "expired":
        return "badge-warning";
      case "disabled":
        return "badge-neutral";
      default:
        return "badge-ghost";
    }
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Integrations</h1>
      <p class="text-base-content/60 mt-1">Connect external services to sync files with your Knowledge Base</p>
    </div>
  </div>

  <!-- Status messages -->
  {#if statusMessage}
    <div class="alert alert-success">
      <span>{statusMessage}</span>
      <button class="btn btn-ghost btn-sm" onclick={() => (statusMessage = null)}>Dismiss</button>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-error">
      <span>{error}</span>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" onclick={() => loadData()}>Retry</button>
        <button class="btn btn-ghost btn-sm" onclick={() => (error = null)}>Dismiss</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else}
    <!-- Connected Accounts -->
    <div class="card bg-base-200 shadow">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title">Connected Accounts</h2>
          <button class="btn btn-primary btn-sm" onclick={handleConnect}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Connect Microsoft
          </button>
        </div>

        {#if connections.length === 0}
          <div class="text-center py-8 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p>No connected accounts yet.</p>
            <p class="text-sm mt-1">Connect your Microsoft account to sync SharePoint files.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each connections as conn}
              <div class="flex items-center justify-between p-4 bg-base-100 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-lg font-semibold shrink-0">
                    {(conn.provider_email || conn.provider || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div class="font-medium">{conn.provider_email || "Microsoft Account"}</div>
                    <div class="text-sm text-base-content/60">
                      <span class="badge {getStatusBadgeClass(conn.status)} badge-sm">{conn.status}</span>
                      {#if conn.capabilities?.length}
                        {#each conn.capabilities as cap}
                          <span class="badge badge-outline badge-sm ml-1">{cap}</span>
                        {/each}
                      {/if}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn btn-ghost btn-sm"
                    onclick={() => handleTestConnection(conn._id)}
                  >
                    Test
                  </button>
                  <button
                    class="btn btn-ghost btn-sm text-error"
                    onclick={() => handleDisconnect(conn._id)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Sync Jobs -->
    <div class="card bg-base-200 shadow">
      <div class="card-body">
        <h2 class="card-title mb-4">Sync Jobs</h2>

        {#if syncJobs.length === 0}
          <div class="text-center py-8 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p>No sync jobs yet.</p>
            <p class="text-sm mt-1">Create a sync job from the Knowledge Base to sync SharePoint folders.</p>
          </div>
        {:else}
          <div class="overflow-visible">
            <table class="table">
              <thead>
                <tr>
                  <th>SharePoint Folder</th>
                  <th>KB Folder</th>
                  <th>Status</th>
                  <th>Last Sync</th>
                  <th>Interval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each syncJobs as job}
                  <tr>
                    <td>
                      <div class="text-sm">{job.remote_folder_path || job.remote_folder_id}</div>
                    </td>
                    <td>
                      <div class="text-sm font-mono">{job.aibox_folder_id}</div>
                    </td>
                    <td>
                      <span class="badge {getStatusBadgeClass(job.status)} badge-sm">{job.status}</span>
                      {#if job.error_message}
                        <div class="text-xs text-error mt-1">{job.error_message}</div>
                      {/if}
                    </td>
                    <td class="text-sm">
                      {formatDate(job.last_sync_at)}
                      {#if job.last_sync_result}
                        <div class="text-xs text-base-content/50">
                          +{job.last_sync_result.files_created}
                          ~{job.last_sync_result.files_updated}
                          -{job.last_sync_result.files_deleted}
                        </div>
                      {/if}
                    </td>
                    <td>
                      <div class="dropdown dropdown-end">
                        <div tabindex="0" role="button" class="btn btn-ghost btn-xs gap-1">
                          {intervalOptions.find(o => o.value === job.polling_interval_minutes)?.label || job.polling_interval_minutes + "m"}
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-28 p-2 shadow-lg">
                          {#each intervalOptions as opt}
                            <li>
                              <button
                                class:active={opt.value === job.polling_interval_minutes}
                                onclick={() => { handleIntervalChange(job._id, opt.value); (document.activeElement as HTMLElement)?.blur(); }}
                              >
                                {opt.label}
                              </button>
                            </li>
                          {/each}
                        </ul>
                      </div>
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button
                          class="btn btn-ghost btn-xs"
                          onclick={() => handleTriggerSync(job._id)}
                          title="Sync now"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          class="btn btn-ghost btn-xs"
                          onclick={() => handleTogglePause(job)}
                          title={job.status === "active" ? "Pause" : "Resume"}
                        >
                          {#if job.status === "active"}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          {/if}
                        </button>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          onclick={() => handleDeleteSyncJob(job._id)}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
