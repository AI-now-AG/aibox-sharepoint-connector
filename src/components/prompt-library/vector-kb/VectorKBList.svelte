<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { svgIcons } from "$assets/icons";
  import Loading from "$components/Loading.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import ChunkViewer from "./ChunkViewer.svelte";
  import type { VectorFolder, VectorDataSource, StorageUsage } from "$types/VectorKB";
  import { DataSourceStatus } from "$types/VectorKB";
  import { getTranscriptionConfig } from "$api/transcription/transcription-api";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

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
  let breadcrumbs = $state<{ id: string | null; name: string }[]>([{ id: null, name: "" }]);

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

  // Delete confirmation dialog state
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();
  let deleteTarget = $state<{ type: "file" | "folder" | "multiple"; id: string; name: string; ids?: string[] } | null>(null);

  // Multi-select state
  let selectedFiles = $state<Set<string>>(new Set());
  let deletingMultiple = $state(false);

  // API base URL - will be set from config
  let apiBase = $state("");

  // SSE connection for real-time status updates
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Sorting state
  type SortField = "name" | "type" | "size" | "status" | "date";
  type SortDirection = "asc" | "desc";
  let sortField = $state<SortField>("name");
  let sortDirection = $state<SortDirection>("asc");

  // Derived sorted data sources
  let sortedDataSources = $derived.by(() => {
    const sorted = [...dataSources];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.original_file_name.localeCompare(b.original_file_name);
          break;
        case "type":
          comparison = a.file_type.localeCompare(b.file_type);
          break;
        case "size":
          comparison = a.file_size_bytes - b.file_size_bytes;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

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
      // Connect to SSE for real-time status updates
      connectSSE();
    }
  }

  function navigateToFolder(folderId: string | null, folderName: string) {
    currentFolderId = folderId;

    if (folderId === null) {
      breadcrumbs = [{ id: null, name: "" }];
    } else {
      const existingIndex = breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex >= 0) {
        breadcrumbs = breadcrumbs.slice(0, existingIndex + 1);
      } else {
        breadcrumbs = [...breadcrumbs, { id: folderId, name: folderName }];
      }
    }

    // Disconnect SSE before fetching new folder data (will reconnect after fetch)
    disconnectSSE();
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

  function confirmDeleteDataSource(id: string, name: string) {
    deleteTarget = { type: "file", id, name };
    confirmDeleteModal?.showModal();
  }

  // Multi-select functions
  function toggleFileSelection(id: string) {
    const newSet = new Set(selectedFiles);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedFiles = newSet;
  }

  function toggleSelectAll() {
    if (selectedFiles.size === dataSources.length) {
      selectedFiles = new Set();
    } else {
      selectedFiles = new Set(dataSources.map(ds => ds._id));
    }
  }

  function confirmDeleteMultiple() {
    if (selectedFiles.size === 0) return;
    const ids = Array.from(selectedFiles);
    deleteTarget = {
      type: "multiple",
      id: "",
      name: `${ids.length} ${t("vector-kb.files").toLowerCase()}`,
      ids
    };
    confirmDeleteModal?.showModal();
  }

  function clearSelection() {
    selectedFiles = new Set();
  }

  async function executeDelete() {
    if (!deleteTarget) return;

    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      if (deleteTarget.type === "multiple" && deleteTarget.ids) {
        // Delete multiple files
        deletingMultiple = true;
        const ids = deleteTarget.ids;
        let failedCount = 0;

        for (const id of ids) {
          try {
            const response = await fetch(`${apiBase}/api/vector-kb/data-sources/${id}`, {
              method: "DELETE",
            });
            const result = await response.json();
            if (!result.success) {
              failedCount++;
            }
          } catch {
            failedCount++;
          }
        }

        deletingMultiple = false;
        clearSelection();

        if (failedCount > 0) {
          alert(`Failed to delete ${failedCount} file(s)`);
        }
        fetchData();
      } else if (deleteTarget.type === "file") {
        const response = await fetch(`${apiBase}/api/vector-kb/data-sources/${deleteTarget.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          fetchData();
        } else {
          alert("Failed to delete: " + result.error);
        }
      } else {
        // folder
        const response = await fetch(`${apiBase}/api/vector-kb/folders/${deleteTarget.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          fetchData();
        } else {
          alert("Failed to delete folder: " + result.error);
        }
      }
    } catch (e) {
      alert("Error deleting: " + (e as Error).message);
    } finally {
      deleteTarget = null;
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

  async function downloadFile(id: string, fileName: string) {
    try {
      // Ensure we have API URL
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      const response = await fetch(`${apiBase}/api/vector-kb/data-sources/${id}/download`);
      const result = await response.json();

      if (result.success && result.data?.downloadUrl) {
        // Create a temporary anchor to trigger download with original filename
        const link = document.createElement("a");
        link.href = result.data.downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Failed to download: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error downloading: " + (e as Error).message);
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
      alert(t("vector-kb.folder-name-required"));
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

  function confirmDeleteFolder(folder: VectorFolder) {
    deleteTarget = { type: "folder", id: folder._id, name: folder.name };
    confirmDeleteModal?.showModal();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getStatusBadge(status: DataSourceStatus): { class: string; text: string } {
    switch (status) {
      case DataSourceStatus.Pending:
        return { class: "badge-soft badge-warning", text: t("vector-kb.status.pending") };
      case DataSourceStatus.Processing:
        return { class: "badge-soft badge-info", text: t("vector-kb.status.processing") };
      case DataSourceStatus.Completed:
        return { class: "badge-soft badge-success", text: t("vector-kb.status.completed") };
      case DataSourceStatus.Failed:
        return { class: "badge-soft badge-error", text: t("vector-kb.status.failed") };
      default:
        return { class: "badge-ghost", text: status };
    }
  }

  function connectSSE() {
    if (!apiBase || !tenantId) return;

    // Close existing connection if any
    disconnectSSE();

    const sseUrl = `${apiBase}/api/vector-kb/status-stream?tenantId=${tenantId}&folderId=${currentFolderId || "root"}`;

    eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log("[VectorKB] SSE connected");
      reconnectAttempts = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "status_update") {
          // Update the specific data source in the list
          dataSources = dataSources.map((ds) => {
            if (ds._id === data.dataSourceId) {
              return {
                ...ds,
                status: data.status,
                error_message: data.errorMessage,
                chunk_count: data.chunkCount ?? ds.chunk_count,
              };
            }
            return ds;
          });
        }
      } catch (e) {
        console.error("[VectorKB] SSE message parse error:", e);
      }
    };

    eventSource.onerror = () => {
      console.log("[VectorKB] SSE connection error, attempting reconnect...");
      disconnectSSE();

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(connectSSE, delay);
      }
    };
  }

  function disconnectSSE() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  onMount(() => {
    fetchData();
  });

  onDestroy(() => {
    disconnectSSE();
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

<div class="w-full px-4 lg:px-6">
  <!-- Storage Usage & Toolbar - always show -->
  <div class="flex items-center justify-between mb-4 p-4 bg-base-100 rounded-lg">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium">{t("vector-kb.storage-usage")}:</span>
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
      {#if currentFolderId === null}
        <button
          class="btn btn-sm"
          onclick={openCreateFolderDialog}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {t("vector-kb.new-folder")}
        </button>
      {/if}
      <button
        class="btn btn-primary btn-sm"
        disabled={uploading}
        onclick={() => fileInput?.click()}
      >
        {#if uploading}
          <span class="loading loading-spinner loading-sm"></span>
          {t("vector-kb.uploading")}
        {:else}
          {@html svgIcons.upload}
          {t("vector-kb.upload-files")}
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
                  {crumb.name}
                {/if}
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
      // Sort folders alphabetically by name
      result.sort((a, b) => a.name.localeCompare(b.name));
      console.log("[VectorKB] Filtered folders:", result.length);
      return result;
    })()}
    {#if filteredFolders.length > 0}
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">{t("vector-kb.folders")}</h3>
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
                          {t("vector-kb.rename")}
                        </button>
                      </li>
                      <li>
                        <button class="text-error" onclick={() => confirmDeleteFolder(folder)}>
                          {@html svgIcons.trash}
                          {t("vector-kb.delete")}
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
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold">{t("vector-kb.files")}</h3>
          {#if selectedFiles.size > 0}
            <div class="flex items-center gap-2">
              <span class="text-sm text-base-content/70">
                {selectedFiles.size} {t("vector-kb.selected")}
              </span>
              <button
                class="btn btn-error btn-sm"
                onclick={confirmDeleteMultiple}
                disabled={deletingMultiple}
              >
                {#if deletingMultiple}
                  <span class="loading loading-spinner loading-xs"></span>
                {:else}
                  {@html svgIcons.trash}
                {/if}
                {t("vector-kb.delete-selected")}
              </button>
              <button
                class="btn btn-ghost btn-sm"
                onclick={clearSelection}
              >
                {t("vector-kb.clear-selection")}
              </button>
            </div>
          {/if}
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="w-12">
                  <label>
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      checked={selectedFiles.size === dataSources.length && dataSources.length > 0}
                      indeterminate={selectedFiles.size > 0 && selectedFiles.size < dataSources.length}
                      onchange={toggleSelectAll}
                    />
                  </label>
                </th>
                <th>
                  <button
                    class="flex items-center gap-1 hover:text-primary transition-colors"
                    onclick={() => toggleSort("name")}
                  >
                    {t("vector-kb.file-name")}
                    {#if sortField === "name"}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {#if sortDirection === "asc"}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        {:else}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        {/if}
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    {/if}
                  </button>
                </th>
                <th class="hidden md:table-cell">
                  <button
                    class="flex items-center gap-1 hover:text-primary transition-colors"
                    onclick={() => toggleSort("type")}
                  >
                    {t("vector-kb.type")}
                    {#if sortField === "type"}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {#if sortDirection === "asc"}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        {:else}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        {/if}
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    {/if}
                  </button>
                </th>
                <th class="hidden lg:table-cell">
                  <button
                    class="flex items-center gap-1 hover:text-primary transition-colors"
                    onclick={() => toggleSort("size")}
                  >
                    {t("vector-kb.size")}
                    {#if sortField === "size"}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {#if sortDirection === "asc"}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        {:else}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        {/if}
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    {/if}
                  </button>
                </th>
                <th>{t("vector-kb.chunks")}</th>
                <th>
                  <button
                    class="flex items-center gap-1 hover:text-primary transition-colors"
                    onclick={() => toggleSort("status")}
                  >
                    {t("vector-kb.status")}
                    {#if sortField === "status"}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {#if sortDirection === "asc"}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        {:else}
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        {/if}
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    {/if}
                  </button>
                </th>
                <th>{t("vector-kb.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedDataSources as source}
                {@const statusBadge = getStatusBadge(source.status)}
                <tr class={selectedFiles.has(source._id) ? "bg-primary/10" : ""}>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        checked={selectedFiles.has(source._id)}
                        onchange={() => toggleFileSelection(source._id)}
                      />
                    </label>
                  </td>
                  <td class="max-w-xs">
                    <div class="text-sm font-medium line-clamp-2" title={source.original_file_name}>
                      {source.original_file_name}
                    </div>
                    <!-- Show when Grösse column is hidden (<1024px) -->
                    <div class="text-xs text-base-content/60 lg:hidden">
                      <!-- Show Typ only when Typ column is hidden (<768px) -->
                      <span class="md:hidden">{source.file_type.toUpperCase()} • </span>{formatFileSize(source.file_size_bytes)}
                    </div>
                  </td>
                  <td class="hidden md:table-cell">
                    <span class="badge badge-ghost">{source.file_type.toUpperCase()}</span>
                  </td>
                  <td class="hidden lg:table-cell">{formatFileSize(source.file_size_bytes)}</td>
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
                    <!-- 3-dot dropdown menu for screens < 1280px -->
                    <div class="dropdown dropdown-end xl:hidden">
                      <button tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-44">
                        {#if source.status === DataSourceStatus.Completed}
                          <li>
                            <button onclick={() => openChunkViewer(source)}>
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {t("vector-kb.view-chunks")}
                            </button>
                          </li>
                        {/if}
                        <li>
                          <button onclick={() => downloadFile(source._id, source.original_file_name)}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t("vector-kb.download")}
                          </button>
                        </li>
                        {#if source.status === DataSourceStatus.Failed}
                          <li>
                            <button onclick={() => retryProcessing(source._id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {t("vector-kb.retry")}
                            </button>
                          </li>
                        {/if}
                        <li>
                          <button class="text-error" onclick={() => confirmDeleteDataSource(source._id, source.original_file_name)}>
                            {@html svgIcons.trash}
                            {t("vector-kb.delete")}
                          </button>
                        </li>
                      </ul>
                    </div>

                    <!-- Individual buttons for screens >= 1280px -->
                    <div class="hidden xl:flex gap-1">
                      {#if source.status === DataSourceStatus.Completed}
                        <button
                          class="btn btn-xs btn-ghost"
                          onclick={() => openChunkViewer(source)}
                          title={t("vector-kb.view-chunks")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      {/if}
                      <button
                        class="btn btn-xs btn-ghost"
                        onclick={() => downloadFile(source._id, source.original_file_name)}
                        title={t("vector-kb.download")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {#if source.status === DataSourceStatus.Failed}
                        <button
                          class="btn btn-xs btn-warning"
                          onclick={() => retryProcessing(source._id)}
                          title={t("vector-kb.retry")}
                        >
                          {t("vector-kb.retry")}
                        </button>
                      {/if}
                      <button
                        class="btn btn-xs btn-ghost text-error hover:bg-error/10"
                        onclick={() => confirmDeleteDataSource(source._id, source.original_file_name)}
                        title={t("vector-kb.delete")}
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
      <!-- Empty state with drop zone -->
      <button
        type="button"
        class="w-full border-2 border-dashed border-base-300 rounded-xl p-12 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
        onclick={() => fileInput?.click()}
        ondragover={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/10'); }}
        ondragleave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/10'); }}
        ondrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
          if (e.dataTransfer?.files) {
            const input = fileInput;
            const dt = new DataTransfer();
            for (const file of e.dataTransfer.files) {
              dt.items.add(file);
            }
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-base-200 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/40 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-base font-medium text-base-content/70 group-hover:text-base-content transition-colors">
              {t("vector-kb.drop-files-here")}
            </p>
            <p class="text-sm text-base-content/50 mt-1">
              {t("vector-kb.or-click-to-browse")}
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-base-content/40">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF, TXT, DOCX
            </span>
          </div>
        </div>
      </button>
    {/if}
  {/if}
</div>

<!-- Folder Create/Rename Dialog -->
<dialog bind:this={folderDialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold mb-4">
      {folderDialogMode === "create" ? t("vector-kb.create-new-folder") : t("vector-kb.rename-folder")}
    </h3>
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">{t("vector-kb.folder-name")} *</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full"
          placeholder={t("vector-kb.enter-folder-name")}
          bind:value={folderName}
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">{t("vector-kb.description-optional")}</span>
        </label>
        <textarea
          class="textarea textarea-bordered w-full"
          placeholder={t("vector-kb.enter-folder-description")}
          bind:value={folderDescription}
          rows="2"
        ></textarea>
      </div>
    </div>
    <div class="modal-action">
      <button class="btn btn-ghost" onclick={closeFolderDialog}>{t("vector-kb.cancel")}</button>
      <button
        class="btn btn-primary"
        disabled={!folderName.trim() || savingFolder}
        onclick={saveFolder}
      >
        {#if savingFolder}
          <span class="loading loading-spinner loading-sm"></span>
        {/if}
        {folderDialogMode === "create" ? t("vector-kb.create") : t("vector-kb.save")}
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

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  bind:modal={confirmDeleteModal}
  confirm={executeDelete}
  title={deleteTarget?.type === "folder"
    ? t("vector-kb.delete-folder")
    : deleteTarget?.type === "multiple"
      ? t("vector-kb.delete-selected")
      : t("vector-kb.delete-file")}
  description={deleteTarget?.type === "folder"
    ? t("vector-kb.confirm-delete-folder", { name: deleteTarget?.name ?? "" })
    : deleteTarget?.type === "multiple"
      ? t("vector-kb.confirm-delete-multiple")
      : t("vector-kb.confirm-delete-file")}
/>
