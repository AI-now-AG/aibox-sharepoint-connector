<script lang="ts">
  import { onMount } from "svelte";
  import { VectorKBScope } from "$types/AIProvider";
  import type { VectorFolder, VectorDataSource } from "$types/VectorKB";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();

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

  // Dropdown states
  let folderDropdownOpen = $state(false);
  let fileDropdownOpen = $state(false);
  let folderSearchQuery = $state("");
  let fileSearchQuery = $state("");

  // Refs for click outside
  let folderDropdownRef: HTMLDivElement;
  let fileDropdownRef: HTMLDivElement;

  const apiBase = TRANSCRIPTION_API_URL || "";

  // Filtered lists based on search
  let filteredFolders = $derived(
    folders.filter((f) =>
      f.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
    )
  );

  let filteredDataSources = $derived(
    dataSources.filter((ds) =>
      ds.original_file_name.toLowerCase().includes(fileSearchQuery.toLowerCase())
    )
  );

  // Selected items display text
  let selectedFoldersText = $derived(() => {
    if (selectedFolderIds.length === 0) return t("assistant-dialog.vector-kb.select-folders-placeholder");
    if (selectedFolderIds.length === 1) {
      const folder = folders.find((f) => f._id === selectedFolderIds[0]);
      return folder?.name || "1 folder";
    }
    return `${selectedFolderIds.length} ${t("assistant-dialog.kb.folders-selected")}`;
  });

  let selectedFilesText = $derived(() => {
    if (selectedDataSourceIds.length === 0) return t("assistant-dialog.vector-kb.select-files-placeholder");
    if (selectedDataSourceIds.length === 1) {
      const ds = dataSources.find((d) => d._id === selectedDataSourceIds[0]);
      return ds?.original_file_name || "1 file";
    }
    return `${selectedDataSourceIds.length} ${t("assistant-dialog.kb.files-selected")}`;
  });

  // Auto-enable vectorKbEnabled when component mounts
  onMount(() => {
    vectorKbEnabled = true;
    fetchVectorKBData();

    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (folderDropdownRef && !folderDropdownRef.contains(event.target as Node)) {
        folderDropdownOpen = false;
      }
      if (fileDropdownRef && !fileDropdownRef.contains(event.target as Node)) {
        fileDropdownOpen = false;
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });

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

  $effect(() => {
    if (vectorKbEnabled && folders.length === 0 && dataSources.length === 0) {
      fetchVectorKBData();
    }
  });
</script>

<div class="space-y-4">
  <!-- Search Scope -->
  <div class="space-y-3">
    <p class="text-sm font-medium text-base-content/70">{t("assistant-dialog.vector-kb.search-scope")}</p>

    <!-- Chip-style scope selection -->
    <div class="flex flex-wrap gap-2">
      <label
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all border
               {selectedScope === VectorKBScope.All
                 ? 'border-primary bg-primary/5 text-primary'
                 : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30'}"
      >
        <input
          type="radio"
          name="vectorScope"
          class="radio radio-primary radio-sm"
          checked={selectedScope === VectorKBScope.All}
          onchange={() => selectedScope = VectorKBScope.All}
          {disabled}
        />
        <span class="text-sm font-medium">{t("assistant-dialog.vector-kb.scope.all.title")}</span>
      </label>

      <label
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all border
               {selectedScope === VectorKBScope.Folder
                 ? 'border-primary bg-primary/5 text-primary'
                 : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30'}"
      >
        <input
          type="radio"
          name="vectorScope"
          class="radio radio-primary radio-sm"
          checked={selectedScope === VectorKBScope.Folder}
          onchange={() => selectedScope = VectorKBScope.Folder}
          {disabled}
        />
        <span class="text-sm font-medium">{t("assistant-dialog.vector-kb.scope.folder.title")}</span>
      </label>

      <!-- <label
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all border
               {selectedScope === VectorKBScope.DataSource
                 ? 'border-primary bg-primary/5 text-primary'
                 : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30'}"
      >
        <input
          type="radio"
          name="vectorScope"
          class="radio radio-primary radio-sm"
          checked={selectedScope === VectorKBScope.DataSource}
          onchange={() => selectedScope = VectorKBScope.DataSource}
          {disabled}
        />
        <span class="text-sm font-medium">{t("assistant-dialog.vector-kb.scope.file.title")}</span>
      </label> -->
    </div>
  </div>

  <!-- Folder Selection Dropdown -->
  {#if selectedScope === VectorKBScope.Folder}
    <div class="space-y-2">
      <p class="text-sm font-medium text-base-content/70">{t("assistant-dialog.kb.select-folders")}</p>

      {#if loading}
        <div class="flex items-center gap-2 text-sm text-base-content/60">
          <span class="loading loading-spinner loading-sm"></span>
          {t("assistant-dialog.vector-kb.loading-folders")}
        </div>
      {:else if folders.length === 0}
        <p class="text-sm text-base-content/60">{t("assistant-dialog.vector-kb.no-folders")}</p>
      {:else}
        <div class="relative" bind:this={folderDropdownRef}>
          <!-- Dropdown trigger -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 border border-base-300 rounded-lg bg-base-100 hover:border-base-content/30 transition-colors"
            onclick={() => folderDropdownOpen = !folderDropdownOpen}
            {disabled}
          >
            <span class="text-sm {selectedFolderIds.length === 0 ? 'text-base-content/50' : 'text-base-content'}">
              {selectedFoldersText()}
            </span>
            <span class="text-base-content/50 transition-transform {folderDropdownOpen ? 'rotate-180' : ''}">
              {@html svgIcons.dropdownArrowDown}
            </span>
          </button>

          <!-- Dropdown menu -->
          {#if folderDropdownOpen}
            <div class="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
              <!-- Search input -->
              <div class="p-2 border-b border-base-200">
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50">
                    {@html svgIcons.search}
                  </span>
                  <input
                    type="text"
                    class="input input-sm input-bordered w-full pl-8"
                    placeholder={t("assistant-dialog.vector-kb.search-folders")}
                    bind:value={folderSearchQuery}
                    onclick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <!-- Checkbox list -->
              <div class="max-h-48 overflow-y-auto p-1">
                {#if filteredFolders.length === 0}
                  <p class="text-sm text-base-content/50 p-2 text-center">{t("assistant-dialog.vector-kb.no-results")}</p>
                {:else}
                  {#each filteredFolders as folder}
                    <label
                      class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-base-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary checkbox-sm"
                        checked={selectedFolderIds.includes(folder._id)}
                        onchange={() => toggleFolder(folder._id)}
                      />
                      <span class="text-sm">{folder.name}</span>
                    </label>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- File Selection Dropdown -->
  {#if selectedScope === VectorKBScope.DataSource}
    <div class="space-y-2">
      <p class="text-sm font-medium text-base-content/70">{t("assistant-dialog.kb.select-files")}</p>

      {#if loading}
        <div class="flex items-center gap-2 text-sm text-base-content/60">
          <span class="loading loading-spinner loading-sm"></span>
          {t("assistant-dialog.vector-kb.loading-files")}
        </div>
      {:else if dataSources.length === 0}
        <p class="text-sm text-base-content/60">{t("assistant-dialog.vector-kb.no-files")}</p>
      {:else}
        <div class="relative" bind:this={fileDropdownRef}>
          <!-- Dropdown trigger -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 border border-base-300 rounded-lg bg-base-100 hover:border-base-content/30 transition-colors"
            onclick={() => fileDropdownOpen = !fileDropdownOpen}
            {disabled}
          >
            <span class="text-sm {selectedDataSourceIds.length === 0 ? 'text-base-content/50' : 'text-base-content'}">
              {selectedFilesText()}
            </span>
            <span class="text-base-content/50 transition-transform {fileDropdownOpen ? 'rotate-180' : ''}">
              {@html svgIcons.dropdownArrowDown}
            </span>
          </button>

          <!-- Dropdown menu -->
          {#if fileDropdownOpen}
            <div class="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
              <!-- Search input -->
              <div class="p-2 border-b border-base-200">
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50">
                    {@html svgIcons.search}
                  </span>
                  <input
                    type="text"
                    class="input input-sm input-bordered w-full pl-8"
                    placeholder={t("assistant-dialog.vector-kb.search-files")}
                    bind:value={fileSearchQuery}
                    onclick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <!-- Checkbox list -->
              <div class="max-h-48 overflow-y-auto p-1">
                {#if filteredDataSources.length === 0}
                  <p class="text-sm text-base-content/50 p-2 text-center">{t("assistant-dialog.vector-kb.no-results")}</p>
                {:else}
                  {#each filteredDataSources as ds}
                    <label
                      class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-base-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary checkbox-sm"
                        checked={selectedDataSourceIds.includes(ds._id)}
                        onchange={() => toggleDataSource(ds._id)}
                      />
                      <span class="text-sm flex-1 truncate">{ds.original_file_name}</span>
                      <span class="badge badge-ghost badge-xs">{ds.file_type}</span>
                    </label>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Info message -->
  <p class="text-xs text-base-content/60 italic">
    {#if selectedScope === VectorKBScope.All}
      {t("assistant-dialog.vector-kb.info.all")}
    {:else if selectedScope === VectorKBScope.Folder}
      {t("assistant-dialog.vector-kb.info.folder")}
    {:else}
      {t("assistant-dialog.vector-kb.info.file")}
    {/if}
  </p>
</div>

<style>
  .relative :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
