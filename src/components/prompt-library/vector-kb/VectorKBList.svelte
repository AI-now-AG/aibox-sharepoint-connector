<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";
  import Loading from "$components/Loading.svelte";
  import ChunkViewer from "./ChunkViewer.svelte";
  import type { VectorFolder, VectorDataSource, StorageUsage } from "$types/VectorKB";
  import { DataSourceStatus } from "$types/VectorKB";
  import { getTranscriptionConfig } from "$api/transcription/transcription-api";

  interface Props {
    tenantId: string;
    userId?: string;
    apiUrl?: string;
  }

  let { tenantId, userId = "system"}: Props = $props();

  let loading = $state(true);
  let folders = $state<VectorFolder[]>([]);
  let dataSources = $state<VectorDataSource[]>([]);
  let storageUsage = $state<StorageUsage | null>(null);
  let error = $state<string | null>(null);
  let currentFolderId = $state<string | null>(null);
  let breadcrumbs = $state<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);

  // File upload state
  let fileInput: HTMLInputElement;
  let uploading = $state(false);

  // Folder management state
  let folderDialog: HTMLDialogElement;
  let folderDialogMode = $state<"create" | "rename">("create");
  let folderName = $state("");
  let folderDescription = $state("");
  let editingFolderId = $state<string | null>(null);
  let savingFolder = $state(false);

  // Chunk viewer state
  let chunkViewerRef: ChunkViewer;
  let selectedDataSource = $state<VectorDataSource | null>(null);

  // API base URL - will be set from config
  let apiBase = $state("");

  function openChunkViewer(source: VectorDataSource) {
    selectedDataSource = source;
    // Use tick to ensure the component is rendered with new props
    setTimeout(() => chunkViewerRef?.open(), 0);
  }

  async function fetchData() {
    loading = true;
    error = null;

    console.log("[VectorKB] ========== FETCH START ==========");
    console.log("[VectorKB] tenantId:", tenantId, "type:", typeof tenantId);
    console.log("[VectorKB] currentFolderId:", currentFolderId);

    if (!tenantId) {
      console.error("[VectorKB] ERROR: tenantId is empty or undefined!");
      error = "Tenant ID is missing. Please refresh the page.";
      loading = false;
      return;
    }

    try {
      // Get API base URL from config if not already set
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
        console.log("[VectorKB] Got API URL from config:", apiBase);
      }

      const headers = {
        "Content-Type": "application/json",
      };

      const foldersUrl = `${apiBase}/api/vector-kb/folders?tenantId=${tenantId}`;
      const dataSourcesUrl = `${apiBase}/api/vector-kb/data-sources?tenantId=${tenantId}&folderId=${currentFolderId || "root"}`;
      const storageUrl = `${apiBase}/api/vector-kb/storage?tenantId=${tenantId}`;

      console.log("[VectorKB] Fetching:", { foldersUrl, dataSourcesUrl, storageUrl });

      // Fetch folders and data sources in parallel
      const [foldersRes, dataSourcesRes, storageRes] = await Promise.all([
        fetch(foldersUrl, { headers }),
        fetch(dataSourcesUrl, { headers }),
        fetch(storageUrl, { headers }),
      ]);

      console.log("[VectorKB] Response status - folders:", foldersRes.status, "dataSources:", dataSourcesRes.status, "storage:", storageRes.status);

      const [foldersData, dataSourcesData, storageData] = await Promise.all([
        foldersRes.json(),
        dataSourcesRes.json(),
        storageRes.json(),
      ]);

      console.log("[VectorKB] Folders raw response:", JSON.stringify(foldersData, null, 2));
      console.log("[VectorKB] DataSources raw response:", JSON.stringify(dataSourcesData, null, 2));
      console.log("[VectorKB] Storage raw response:", JSON.stringify(storageData, null, 2));

      if (foldersData.success) {
        folders = foldersData.data || [];
        console.log("[VectorKB] Loaded", folders.length, "folders");
        folders.forEach((f, i) => {
          console.log(`[VectorKB] Folder ${i}:`, f.name, "parent_folder_id:", f.parent_folder_id, "type:", typeof f.parent_folder_id);
        });
      } else {
        console.error("[VectorKB] Folders API error:", foldersData.error);
        error = foldersData.error || "Failed to load folders";
      }

      if (dataSourcesData.success) {
        dataSources = dataSourcesData.data || [];
        console.log("[VectorKB] Loaded", dataSources.length, "data sources");
      } else {
        console.error("[VectorKB] DataSources API error:", dataSourcesData.error);
      }

      if (storageData.success && storageData.data) {
        // Map backend response to frontend StorageUsage interface
        const data = storageData.data;
        storageUsage = {
          usedBytes: data.totalSizeBytes || 0,
          usedMB: data.totalSizeMB || 0,
          maxMB: data.maxStorageMB || 500,
          usedPercentage: data.usagePercentage || 0,
          remainingMB: (data.maxStorageMB || 500) - (data.totalSizeMB || 0),
        };
        console.log("[VectorKB] Storage usage:", storageUsage);
      } else {
        console.error("[VectorKB] Storage API error:", storageData.error);
        // Set default storage even if API fails
        storageUsage = {
          usedBytes: 0,
          usedMB: 0,
          maxMB: 500,
          usedPercentage: 0,
          remainingMB: 500,
        };
      }

      console.log("[VectorKB] ========== FETCH COMPLETE ==========");
    } catch (e) {
      console.error("[VectorKB] Fetch exception:", e);
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  function navigateToFolder(folderId: string | null, folderName: string) {
    currentFolderId = folderId;

    if (folderId === null) {
      breadcrumbs = [{ id: null, name: "Root" }];
    } else {
      const existingIndex = breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex >= 0) {
        breadcrumbs = breadcrumbs.slice(0, existingIndex + 1);
      } else {
        breadcrumbs = [...breadcrumbs, { id: folderId, name: folderName }];
      }
    }

    fetchData();
  }

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    uploading = true;

    // Ensure we have API URL
    if (!apiBase) {
      const config = await getTranscriptionConfig();
      apiBase = config.apiUrl;
    }

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("tenantId", tenantId);
        formData.append("createdBy", userId);
        formData.append("file", file);
        if (currentFolderId) {
          formData.append("folderId", currentFolderId);
        }

        const response = await fetch(`${apiBase}/api/vector-kb/data-sources/upload`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          console.error("Upload failed:", result.error);
        }
      } catch (e) {
        console.error("Upload error:", e);
      }
    }

    uploading = false;
    input.value = ""; // Reset file input
    fetchData(); // Refresh list
  }

  async function deleteDataSource(id: string) {
    if (!confirm("Are you sure you want to delete this file? All associated chunks will also be deleted.")) {
      return;
    }

    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      const response = await fetch(`${apiBase}/api/vector-kb/data-sources/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
      } else {
        alert("Failed to delete: " + result.error);
      }
    } catch (e) {
      alert("Error deleting file: " + (e as Error).message);
    }
  }

  async function retryProcessing(id: string) {
    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      const response = await fetch(`${apiBase}/api/vector-kb/data-sources/${id}/retry`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
      } else {
        alert("Failed to retry: " + result.error);
      }
    } catch (e) {
      alert("Error retrying: " + (e as Error).message);
    }
  }

  // Folder Management Functions
  function openCreateFolderDialog() {
    folderDialogMode = "create";
    folderName = "";
    folderDescription = "";
    editingFolderId = null;
    folderDialog?.showModal();
  }

  function openRenameFolderDialog(folder: VectorFolder) {
    folderDialogMode = "rename";
    folderName = folder.name;
    folderDescription = folder.description || "";
    editingFolderId = folder._id;
    folderDialog?.showModal();
  }

  function closeFolderDialog() {
    folderDialog?.close();
    folderName = "";
    folderDescription = "";
    editingFolderId = null;
  }

  async function saveFolder() {
    if (!folderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    savingFolder = true;
    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      if (folderDialogMode === "create") {
        const response = await fetch(`${apiBase}/api/vector-kb/folders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            name: folderName.trim(),
            description: folderDescription.trim(),
            parentFolderId: currentFolderId,
            createdBy: userId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          closeFolderDialog();
          fetchData();
        } else {
          alert("Failed to create folder: " + result.error);
        }
      } else {
        // Rename folder
        const response = await fetch(`${apiBase}/api/vector-kb/folders/${editingFolderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: folderName.trim(),
            description: folderDescription.trim(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          closeFolderDialog();
          fetchData();
        } else {
          alert("Failed to rename folder: " + result.error);
        }
      }
    } catch (e) {
      alert("Error saving folder: " + (e as Error).message);
    } finally {
      savingFolder = false;
    }
  }

  async function deleteFolder(folder: VectorFolder) {
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"? All files inside will also be deleted.`)) {
      return;
    }

    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      const response = await fetch(`${apiBase}/api/vector-kb/folders/${folder._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
      } else {
        alert("Failed to delete folder: " + result.error);
      }
    } catch (e) {
      alert("Error deleting folder: " + (e as Error).message);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getStatusBadge(status: DataSourceStatus): { class: string; text: string } {
    switch (status) {
      case DataSourceStatus.Pending:
        return { class: "badge-warning", text: "Pending" };
      case DataSourceStatus.Processing:
        return { class: "badge-info", text: "Processing" };
      case DataSourceStatus.Completed:
        return { class: "badge-success", text: "Completed" };
      case DataSourceStatus.Failed:
        return { class: "badge-error", text: "Failed" };
      default:
        return { class: "badge-ghost", text: status };
    }
  }

  onMount(() => {
    fetchData();
  });
</script>

<!-- Hidden file input - always rendered -->
<input
  bind:this={fileInput}
  type="file"
  accept=".pdf,.txt,.docx"
  multiple
  class="hidden"
  onchange={handleFileUpload}
/>

<div class="container max-w-5xl mx-auto px-6">
  <!-- Storage Usage & Toolbar - always show -->
  <div class="flex items-center justify-between mb-4 p-4 bg-base-100 rounded-lg">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium">Storage Usage:</span>
      <progress
        class="progress progress-primary w-48"
        value={storageUsage?.usedPercentage ?? 0}
        max="100"
      ></progress>
      <span class="text-sm">
        {(storageUsage?.usedMB ?? 0).toFixed(1)} MB / {storageUsage?.maxMB ?? 500} MB
        ({(storageUsage?.usedPercentage ?? 0).toFixed(1)}%)
      </span>
    </div>
    <div class="flex gap-2">
      <button
        class="btn btn-outline btn-sm"
        onclick={openCreateFolderDialog}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        New Folder
      </button>
      <button
        class="btn btn-primary btn-sm"
        disabled={uploading}
        onclick={() => fileInput?.click()}
      >
        {#if uploading}
          <span class="loading loading-spinner loading-sm"></span>
          Uploading...
        {:else}
          {@html svgIcons.upload}
          Upload Files
        {/if}
      </button>
    </div>
  </div>

  <!-- Breadcrumbs - only show when inside a folder -->
  {#if breadcrumbs.length > 1}
    <div class="breadcrumbs text-sm bg-base-100 px-4 py-2 rounded-lg mb-4">
      <ul>
        {#each breadcrumbs as crumb, index}
          <li>
            {#if index < breadcrumbs.length - 1}
              <button
                class="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                onclick={() => navigateToFolder(crumb.id, crumb.name)}
              >
                {#if index === 0}
                  <!-- Home icon for Root -->
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path fill-rule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <!-- Folder icon for other items -->
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
                  </svg>
                {/if}
                {crumb.name}
              </button>
            {:else}
              <span class="inline-flex items-center gap-1.5 font-medium text-base-content">
                <!-- Folder icon for current folder -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-warning">
                  <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
                </svg>
                {crumb.name}
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if loading}
    <Loading show={true} />
  {:else if error}
    <div class="alert alert-error">
      <span>{error}</span>
    </div>
  {:else}
    <!-- Folders -->
    {@const filteredFolders = (() => {
      console.log("[VectorKB] Filtering folders. Total:", folders.length, "currentFolderId:", currentFolderId);
      const result = folders.filter(f => {
        // Handle null/undefined parent_folder_id for root folders
        const parentId = f.parent_folder_id;
        const isRootFolder = parentId === null || parentId === undefined;
        const isRootView = currentFolderId === null;

        // For root view, show folders with null/undefined parent
        if (isRootView) {
          console.log(`[VectorKB] Filter check: "${f.name}" parentId=${parentId} isRootFolder=${isRootFolder} -> ${isRootFolder}`);
          return isRootFolder;
        }

        // For folder view, compare parent_folder_id with currentFolderId
        const matches = parentId?.toString() === currentFolderId?.toString();
        console.log(`[VectorKB] Filter check: "${f.name}" parentId=${parentId} currentFolderId=${currentFolderId} -> ${matches}`);
        return matches;
      });
      console.log("[VectorKB] Filtered folders:", result.length);
      return result;
    })()}
    {#if filteredFolders.length > 0}
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Folders</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {#each filteredFolders as folder}
            <div class="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div class="card-body p-4">
                <div class="flex items-center justify-between">
                  <button
                    class="flex items-center gap-2 flex-1 text-left cursor-pointer"
                    onclick={() => navigateToFolder(folder._id, folder.name)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span class="font-medium">{folder.name}</span>
                  </button>
                  <div class="dropdown dropdown-end">
                    <button tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                      <li>
                        <button onclick={() => openRenameFolderDialog(folder)}>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Rename
                        </button>
                      </li>
                      <li>
                        <button class="text-error" onclick={() => deleteFolder(folder)}>
                          {@html svgIcons.trash}
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                {#if folder.description}
                  <p class="text-sm text-base-content/60 mt-1">{folder.description}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Data Sources (Files) -->
    {#if dataSources.length > 0}
      <div>
        <h3 class="text-lg font-semibold mb-2">Files</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each dataSources as source}
                {@const statusBadge = getStatusBadge(source.status)}
                <tr>
                  <td class="font-medium">{source.original_file_name}</td>
                  <td>
                    <span class="badge badge-ghost">{source.file_type.toUpperCase()}</span>
                  </td>
                  <td>{formatFileSize(source.file_size_bytes)}</td>
                  <td>{source.chunk_count}</td>
                  <td>
                    <div class="flex items-center gap-1">
                      <span class="badge {statusBadge.class}">{statusBadge.text}</span>
                      {#if source.error_message}
                        <div class="tooltip tooltip-left" data-tip={source.error_message}>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-error cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      {#if source.status === DataSourceStatus.Completed}
                        <button
                          class="btn btn-xs btn-ghost"
                          onclick={() => openChunkViewer(source)}
                          title="View chunks"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      {/if}
                      {#if source.status === DataSourceStatus.Failed}
                        <button
                          class="btn btn-xs btn-warning"
                          onclick={() => retryProcessing(source._id)}
                          title="Retry processing"
                        >
                          Retry
                        </button>
                      {/if}
                      <button
                        class="btn btn-xs btn-error"
                        onclick={() => deleteDataSource(source._id)}
                        title="Delete file"
                      >
                        {@html svgIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else if filteredFolders.length === 0}
      <div class="text-center py-12">
        <div class="flex flex-col items-center gap-4">
          {@html svgIcons.empty || ''}
          <p class="text-base-content/60">No files or folders yet</p>
          <div class="flex gap-2">
            <button
              class="btn btn-outline"
              onclick={openCreateFolderDialog}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Create Folder
            </button>
            <button
              class="btn btn-primary"
              disabled={uploading}
              onclick={() => fileInput?.click()}
            >
              {#if uploading}
                <span class="loading loading-spinner loading-sm"></span>
              {:else}
                {@html svgIcons.upload}
              {/if}
              Upload File
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Folder Create/Rename Dialog -->
<dialog bind:this={folderDialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold mb-4">
      {folderDialogMode === "create" ? "Create New Folder" : "Rename Folder"}
    </h3>
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Folder Name *</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full"
          placeholder="Enter folder name"
          bind:value={folderName}
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Description (optional)</span>
        </label>
        <textarea
          class="textarea textarea-bordered w-full"
          placeholder="Enter folder description"
          bind:value={folderDescription}
          rows="2"
        ></textarea>
      </div>
    </div>
    <div class="modal-action">
      <button class="btn btn-ghost" onclick={closeFolderDialog}>Cancel</button>
      <button
        class="btn btn-primary"
        disabled={!folderName.trim() || savingFolder}
        onclick={saveFolder}
      >
        {#if savingFolder}
          <span class="loading loading-spinner loading-sm"></span>
        {/if}
        {folderDialogMode === "create" ? "Create" : "Save"}
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

<!-- Chunk Viewer -->
{#if selectedDataSource}
  <ChunkViewer
    bind:this={chunkViewerRef}
    dataSourceId={selectedDataSource._id}
    dataSourceName={selectedDataSource.original_file_name}
  />
{/if}
