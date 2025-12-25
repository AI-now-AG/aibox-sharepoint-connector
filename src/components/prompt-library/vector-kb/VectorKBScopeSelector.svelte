<script lang="ts">
  import { onMount } from "svelte";
  import { VectorKBScope } from "$types/AIProvider";
  import type { VectorFolder, VectorDataSource } from "$types/VectorKB";

  interface Props {
    tenantId: string;
    vectorKbEnabled?: boolean;
    selectedScope?: VectorKBScope;
    selectedFolderIds?: string[];
    selectedDataSourceIds?: string[];
    disabled?: boolean;
  }

  let {
    tenantId,
    vectorKbEnabled = $bindable(false),
    selectedScope = $bindable(VectorKBScope.All),
    selectedFolderIds = $bindable([]),
    selectedDataSourceIds = $bindable([]),
    disabled = false,
  }: Props = $props();

  let folders = $state<VectorFolder[]>([]);
  let dataSources = $state<VectorDataSource[]>([]);
  let loading = $state(false);

  const apiBase = import.meta.env.TRANSCRIPTION_API_URL || "";

  async function fetchVectorKBData() {
    if (!tenantId) return;

    loading = true;
    try {
      const [foldersRes, dataSourcesRes] = await Promise.all([
        fetch(`${apiBase}/api/vector-kb/folders?tenantId=${tenantId}`),
        fetch(`${apiBase}/api/vector-kb/data-sources?tenantId=${tenantId}`),
      ]);

      const [foldersData, dataSourcesData] = await Promise.all([
        foldersRes.json(),
        dataSourcesRes.json(),
      ]);

      if (foldersData.success) {
        folders = foldersData.data || [];
      }

      if (dataSourcesData.success) {
        // Only show completed data sources
        dataSources = (dataSourcesData.data || []).filter(
          (ds: VectorDataSource) => ds.status === "completed"
        );
      }
    } catch (e) {
      console.error("Failed to fetch Vector KB data:", e);
    } finally {
      loading = false;
    }
  }

  function toggleFolder(folderId: string) {
    if (selectedFolderIds.includes(folderId)) {
      selectedFolderIds = selectedFolderIds.filter((id) => id !== folderId);
    } else {
      selectedFolderIds = [...selectedFolderIds, folderId];
    }
  }

  function toggleDataSource(dataSourceId: string) {
    if (selectedDataSourceIds.includes(dataSourceId)) {
      selectedDataSourceIds = selectedDataSourceIds.filter((id) => id !== dataSourceId);
    } else {
      selectedDataSourceIds = [...selectedDataSourceIds, dataSourceId];
    }
  }

  onMount(() => {
    if (vectorKbEnabled) {
      fetchVectorKBData();
    }
  });

  $effect(() => {
    if (vectorKbEnabled && folders.length === 0 && dataSources.length === 0) {
      fetchVectorKBData();
    }
  });
</script>

<div class="space-y-4">
  <!-- Enable Vector KB Toggle -->
  <div class="form-control">
    <label class="label cursor-pointer justify-start gap-3">
      <input
        type="checkbox"
        class="toggle toggle-primary"
        bind:checked={vectorKbEnabled}
        {disabled}
      />
      <span class="label-text font-medium">Use Vector Knowledge Base</span>
    </label>
    <p class="text-xs text-base-content/60 ml-14">
      Enable semantic search across uploaded documents for context-aware responses
    </p>
  </div>

  {#if vectorKbEnabled}
    <div class="pl-4 border-l-2 border-primary/30 space-y-4">
      <!-- Scope Selection -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Search Scope</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <label class="label cursor-pointer gap-2">
            <input
              type="radio"
              name="vectorKbScope"
              class="radio radio-primary radio-sm"
              value={VectorKBScope.All}
              bind:group={selectedScope}
              {disabled}
            />
            <span class="label-text">Entire Knowledge Base</span>
          </label>
          <label class="label cursor-pointer gap-2">
            <input
              type="radio"
              name="vectorKbScope"
              class="radio radio-primary radio-sm"
              value={VectorKBScope.Folder}
              bind:group={selectedScope}
              {disabled}
            />
            <span class="label-text">Specific Folders</span>
          </label>
          <label class="label cursor-pointer gap-2">
            <input
              type="radio"
              name="vectorKbScope"
              class="radio radio-primary radio-sm"
              value={VectorKBScope.DataSource}
              bind:group={selectedScope}
              {disabled}
            />
            <span class="label-text">Specific Files</span>
          </label>
        </div>
      </div>

      <!-- Folder Selection -->
      {#if selectedScope === VectorKBScope.Folder}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Select Folders</span>
          </label>
          {#if loading}
            <div class="flex items-center gap-2 text-sm text-base-content/60">
              <span class="loading loading-spinner loading-sm"></span>
              Loading folders...
            </div>
          {:else if folders.length === 0}
            <p class="text-sm text-base-content/60">No folders available</p>
          {:else}
            <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-base-200 rounded-lg">
              {#each folders as folder}
                <label class="label cursor-pointer gap-2 bg-base-100 px-3 py-1 rounded-full hover:bg-base-300">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-sm"
                    checked={selectedFolderIds.includes(folder._id)}
                    onchange={() => toggleFolder(folder._id)}
                    {disabled}
                  />
                  <span class="label-text text-sm">{folder.name}</span>
                </label>
              {/each}
            </div>
          {/if}
          {#if selectedFolderIds.length > 0}
            <p class="text-xs text-base-content/60 mt-1">
              {selectedFolderIds.length} folder(s) selected
            </p>
          {/if}
        </div>
      {/if}

      <!-- Data Source Selection -->
      {#if selectedScope === VectorKBScope.DataSource}
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Select Files</span>
          </label>
          {#if loading}
            <div class="flex items-center gap-2 text-sm text-base-content/60">
              <span class="loading loading-spinner loading-sm"></span>
              Loading files...
            </div>
          {:else if dataSources.length === 0}
            <p class="text-sm text-base-content/60">No processed files available</p>
          {:else}
            <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-base-200 rounded-lg">
              {#each dataSources as ds}
                <label class="label cursor-pointer gap-2 bg-base-100 px-3 py-1 rounded-full hover:bg-base-300">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-sm"
                    checked={selectedDataSourceIds.includes(ds._id)}
                    onchange={() => toggleDataSource(ds._id)}
                    {disabled}
                  />
                  <span class="label-text text-sm">{ds.original_file_name}</span>
                  <span class="badge badge-ghost badge-xs">{ds.file_type}</span>
                </label>
              {/each}
            </div>
          {/if}
          {#if selectedDataSourceIds.length > 0}
            <p class="text-xs text-base-content/60 mt-1">
              {selectedDataSourceIds.length} file(s) selected
            </p>
          {/if}
        </div>
      {/if}

      <!-- Info about scope -->
      <div class="alert alert-info py-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-xs">
          {#if selectedScope === VectorKBScope.All}
            All documents in the Vector KB will be searched for relevant context.
          {:else if selectedScope === VectorKBScope.Folder}
            Only documents in the selected folders will be searched.
          {:else}
            Only the selected files will be searched for relevant context.
          {/if}
        </span>
      </div>
    </div>
  {/if}
</div>
