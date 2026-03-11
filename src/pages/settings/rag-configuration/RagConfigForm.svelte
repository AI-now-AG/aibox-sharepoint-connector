<script lang="ts">
  import Loading from "$components/Loading.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import { actions } from "astro:actions";

  const t = useTranslations();

  interface RagConfigData {
    top_k: number;
    similarity_threshold: number;
    rerank_enabled: boolean;
    rerank_top_n: number;
    rerank_candidates: number;
    hybrid_enabled: boolean;
    hybrid_alpha: number;
    multi_query_enabled: boolean;
    multi_query_count: number;
    answerability_enabled: boolean;
    answerability_threshold: number;
    compression_enabled: boolean;
    multihop_enabled: boolean;
    max_hops: number;
  }

  interface Props {
    configId: string;
    config: RagConfigData | null;
  }

  let { configId, config }: Props = $props();

  let configData: RagConfigData = $state(
    config ?? {
      top_k: 5,
      similarity_threshold: 0.7,
      rerank_enabled: false,
      rerank_top_n: 5,
      rerank_candidates: 50,
      hybrid_enabled: false,
      hybrid_alpha: 0.5,
      multi_query_enabled: false,
      multi_query_count: 3,
      answerability_enabled: false,
      answerability_threshold: 0.6,
      compression_enabled: false,
      multihop_enabled: false,
      max_hops: 3,
    },
  );

  let loading: boolean = $state(false);

  async function saveConfig() {
    if (!configId) {
      addToast({
        message: t("rag-config.no-config-found"),
        type: "error",
      });
      return;
    }

    try {
      loading = true;
      const { error } = await actions.ragConfiguration.update({
        _id: configId,
        ...configData,
      });

      if (!error) {
        addToast({
          message: t("rag-config.update-success"),
          type: "success",
        });
      } else {
        addToast({
          message: t("rag-config.update-failed") + JSON.stringify(error),
          type: "error",
        });
      }
    } catch (error) {
      addToast({
        message: t("rag-config.update-failed") + String(error),
        type: "error",
      });
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <Loading />
{/if}

<form onsubmit={preventDefault(saveConfig)} class="space-y-6">
  <!-- Section 1: Search Settings -->
  <div class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg">
    <input type="checkbox" checked />
    <div class="collapse-title">
      <div class="flex items-center gap-2">
        <span class="label-text text-base-content font-medium">
          {t("tenant.vector-kb.search-settings")}
        </span>
        <span class="badge badge-xs badge-ghost">
          {t("tenant.vector-kb.search-settings-hint")}
        </span>
      </div>
    </div>
    <div class="collapse-content">
      <div class="grid grid-cols-2 gap-4 mx-4 mb-4">
        <!-- Top K Results -->
        <div class="w-full">
          <span class="mb-2 text-base-content font-medium text-sm">
            {t("tenant.vector-kb.top-k")}
          </span>
          <input
            type="number"
            class="input input-bordered w-full mt-1"
            bind:value={configData.top_k}
            min="1"
            max="20"
          />
          <p class="text-xs text-base-content/60 mt-1">
            {t("tenant.vector-kb.top-k-help")}
          </p>
        </div>

        <!-- Similarity Threshold -->
        <div class="w-full">
          <span class="mb-2 text-base-content font-medium text-sm">
            {t("tenant.vector-kb.similarity-threshold")}
          </span>
          <input
            type="number"
            class="input input-bordered w-full mt-1"
            bind:value={configData.similarity_threshold}
            min="0"
            max="1"
            step="0.05"
          />
          <p class="text-xs text-base-content/60 mt-1">
            {t("tenant.vector-kb.similarity-threshold-help")}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 2: Advanced Search Enhancements -->
  <div class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg">
    <input type="checkbox" />
    <div class="collapse-title">
      <div class="flex items-center">
        <span class="label-text text-base-content font-medium">
          {t("tenant.vector-kb.rag-enhancements")}
        </span>
      </div>
    </div>
    <div class="collapse-content">
      <!-- Reranking -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.rerank-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.rerank-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.rerank_enabled}
          />
        </div>
        {#if configData.rerank_enabled}
          <div class="grid grid-cols-2 gap-4 mt-3">
            <div class="w-full">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.rerank-top-n")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.rerank_top_n}
                min="1"
                max="20"
              />
            </div>
            <div class="w-full">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.rerank-candidates")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.rerank_candidates}
                min="10"
                max="100"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Hybrid Search -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.hybrid-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.hybrid-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.hybrid_enabled}
          />
        </div>
        {#if configData.hybrid_enabled}
          <div class="mt-3">
            <div class="w-full max-w-xs">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.hybrid-alpha")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.hybrid_alpha}
                min="0"
                max="1"
                step="0.1"
              />
              <p class="text-xs text-base-content/60 mt-1">
                {t("tenant.vector-kb.hybrid-alpha-help")}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Multi-Query Search -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.multi-query-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.multi-query-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.multi_query_enabled}
          />
        </div>
        {#if configData.multi_query_enabled}
          <div class="mt-3">
            <div class="w-full max-w-xs">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.multi-query-count")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.multi_query_count}
                min="2"
                max="5"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Answerability Check -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.answerability-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.answerability-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.answerability_enabled}
          />
        </div>
        {#if configData.answerability_enabled}
          <div class="mt-3">
            <div class="w-full max-w-xs">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.answerability-threshold")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.answerability_threshold}
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Context Compression -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.compression-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.compression-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.compression_enabled}
          />
        </div>
      </div>

      <!-- Multi-hop RAG -->
      <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-base-content font-medium text-sm">
              {t("tenant.vector-kb.multihop-title")}
            </span>
            <p class="text-xs text-base-content/60">
              {t("tenant.vector-kb.multihop-description")}
            </p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            bind:checked={configData.multihop_enabled}
          />
        </div>
        {#if configData.multihop_enabled}
          <div class="mt-3">
            <div class="w-full max-w-xs">
              <span class="text-base-content text-xs">
                {t("tenant.vector-kb.multihop-max-hops")}
              </span>
              <input
                type="number"
                class="input input-bordered input-sm w-full mt-1"
                bind:value={configData.max_hops}
                min="1"
                max="5"
              />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Save Button -->
  <div class="flex justify-end">
    <button type="submit" class="btn btn-primary" disabled={loading || !configId}>
      {t("rag-config.save")}
    </button>
  </div>
</form>
