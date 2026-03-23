<script lang="ts">
  import { onMount } from "svelte";
  import {
    listConnections,
    listRemoteFolders,
    getOAuthStartUrl,
  } from "$api/integration/integration-api";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    integrationApiUrl: string;
    apiToken: string;
    onSelect: (folder: { connectionId: string; remoteFolderId: string; remoteFolderPath: string }) => void;
    onClose: () => void;
  }

  let { integrationApiUrl, apiToken, onSelect, onClose }: Props = $props();

  // State
  let step = $state<"checking" | "not-connected" | "browsing">("checking");
  let connectionId = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Folder browsing state
  interface RemoteFolder {
    id: string;
    name: string;
    path: string;
    parent_id?: string;
    type: "site" | "drive" | "folder";
  }

  let items = $state<RemoteFolder[]>([]);
  let breadcrumbs = $state<{ id: string | undefined; name: string; type: string }[]>([
    { id: undefined, name: "SharePoint Sites", type: "root" },
  ]);
  let selectedFolder = $state<RemoteFolder | null>(null);

  onMount(() => {
    checkConnection();
  });

  async function checkConnection() {
    step = "checking";
    loading = true;
    error = null;

    try {
      const result = await listConnections(integrationApiUrl, apiToken);
      if (result.success && result.data?.length > 0) {
        // Find an active Microsoft connection
        const activeConn = result.data.find(
          (c: any) => c.provider === "microsoft" && c.status === "active"
        );
        if (activeConn) {
          connectionId = activeConn._id;
          step = "browsing";
          await loadFolder(undefined);
          return;
        }
      }
      step = "not-connected";
    } catch (e) {
      error = (e as Error).message;
      step = "not-connected";
    } finally {
      loading = false;
    }
  }

  function handleConnect() {
    const url = getOAuthStartUrl(integrationApiUrl, apiToken);
    window.location.href = url;
  }

  async function loadFolder(parentId: string | undefined) {
    if (!connectionId) return;
    loading = true;
    error = null;
    selectedFolder = null;

    try {
      const result = await listRemoteFolders(
        integrationApiUrl,
        connectionId,
        parentId,
        apiToken
      );

      if (result.success) {
        items = result.data || [];
      } else {
        error = result.error || "Failed to load folders";
        items = [];
      }
    } catch (e) {
      error = (e as Error).message;
      items = [];
    } finally {
      loading = false;
    }
  }

  function navigateInto(item: RemoteFolder) {
    // Sites and drives are containers — navigate into them
    if (item.type === "site" || item.type === "drive") {
      breadcrumbs = [...breadcrumbs, { id: item.id, name: item.name, type: item.type }];
      loadFolder(item.id);
      return;
    }

    // Folders can be navigated into OR selected
    breadcrumbs = [...breadcrumbs, { id: item.id, name: item.name, type: item.type }];
    loadFolder(item.id);
  }

  function navigateToBreadcrumb(index: number) {
    breadcrumbs = breadcrumbs.slice(0, index + 1);
    const target = breadcrumbs[breadcrumbs.length - 1];
    loadFolder(target.id);
  }

  function selectFolder(item: RemoteFolder) {
    selectedFolder = selectedFolder?.id === item.id ? null : item;
  }

  function confirmSelection() {
    if (!selectedFolder || !connectionId) return;

    // Build a human-readable path from breadcrumbs
    const pathParts = breadcrumbs
      .slice(1)
      .map((b) => b.name)
      .concat(selectedFolder.name);
    const displayPath = pathParts.join(" > ");

    onSelect({
      connectionId,
      remoteFolderId: selectedFolder.id,
      remoteFolderPath: displayPath,
    });
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case "site":
        return "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
      case "drive":
        return "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z";
      case "folder":
        return "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z";
      default:
        return "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z";
    }
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case "site": return "Site";
      case "drive": return "Document Library";
      case "folder": return "Folder";
      default: return type;
    }
  }
</script>

<div class="space-y-4">
  {#if step === "checking"}
    <div class="flex flex-col items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="mt-3 text-base-content/60">Checking Microsoft connection...</p>
    </div>

  {:else if step === "not-connected"}
    <div class="text-center py-8">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <h3 class="text-lg font-semibold mb-2">Connect Microsoft Account</h3>
      <p class="text-base-content/60 mb-6 max-w-sm mx-auto">
        Sign in with your Microsoft account to browse and sync SharePoint files to your Knowledge Base.
      </p>
      <button class="btn btn-primary" onclick={handleConnect}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Connect Microsoft
      </button>
      {#if error}
        <p class="text-error text-sm mt-4">{error}</p>
      {/if}
    </div>

  {:else if step === "browsing"}
    <!-- Breadcrumbs -->
    <div class="text-sm breadcrumbs px-0">
      <ul>
        {#each breadcrumbs as crumb, i}
          <li>
            {#if i < breadcrumbs.length - 1}
              <button class="link link-hover" onclick={() => navigateToBreadcrumb(i)}>
                {crumb.name}
              </button>
            {:else}
              <span class="font-medium">{crumb.name}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>

    {#if error}
      <div class="alert alert-error alert-sm">
        <span>{error}</span>
        <button class="btn btn-ghost btn-xs" onclick={() => loadFolder(breadcrumbs[breadcrumbs.length - 1].id)}>Retry</button>
      </div>
    {/if}

    {#if loading}
      <div class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    {:else if items.length === 0}
      <div class="text-center py-8 text-base-content/50">
        <p>No items found in this location.</p>
        {#if breadcrumbs.length > 1}
          <button class="btn btn-ghost btn-sm mt-2" onclick={() => navigateToBreadcrumb(breadcrumbs.length - 2)}>
            Go Back
          </button>
        {/if}
      </div>
    {:else}
      <div class="max-h-80 overflow-y-auto border border-base-300 rounded-lg">
        {#each items as item}
          <div
            class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 border-b border-base-300 last:border-b-0 cursor-pointer transition-colors {selectedFolder?.id === item.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}"
            onclick={() => item.type === "folder" ? selectFolder(item) : navigateInto(item)}
            ondblclick={() => navigateInto(item)}
            role="button"
            tabindex="0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 {item.type === 'site' ? 'text-info' : item.type === 'drive' ? 'text-warning' : 'text-base-content/60'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTypeIcon(item.type)} />
            </svg>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{item.name}</div>
              <div class="text-xs text-base-content/50">{getTypeLabel(item.type)}</div>
            </div>
            {#if item.type === "site" || item.type === "drive"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            {:else if item.type === "folder"}
              <div class="flex items-center gap-2">
                {#if selectedFolder?.id === item.id}
                  <span class="badge badge-primary badge-sm">Selected</span>
                {/if}
                <button
                  class="btn btn-ghost btn-xs"
                  onclick={(e) => { e.stopPropagation(); navigateInto(item); }}
                  title="Open folder"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Hint -->
      <p class="text-xs text-base-content/50">
        {#if breadcrumbs.length <= 1}
          Select a SharePoint site to browse its document libraries.
        {:else if breadcrumbs[breadcrumbs.length - 1].type === "site"}
          Select a document library.
        {:else}
          Click a folder to select it, or double-click to open it. Navigate into subfolders with the arrow button.
        {/if}
      </p>
    {/if}

    <!-- Action buttons -->
    <div class="flex justify-end gap-2 pt-2 border-t border-base-300">
      <button class="btn btn-ghost btn-sm" onclick={onClose}>
        {t("vector-kb.cancel")}
      </button>
      <button
        class="btn btn-primary btn-sm"
        disabled={!selectedFolder}
        onclick={confirmSelection}
      >
        Sync This Folder
      </button>
    </div>
  {/if}
</div>
