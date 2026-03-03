<script lang="ts">
  import Loading from "$components/Loading.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import { actions } from "astro:actions";

  const t = useTranslations();

  interface KeysData {
    openai_api_key: string | null;
    openai_gpt5_api_key: string | null;
    azure_openai_api_key: string | null;
    perplexity_api_key: string | null;
    anthropic_api_key: string | null;
    gemini_api_key: string | null;
    speech_api_key: string | null;
    elevenLabs_api_key: string | null;
    fal_ai_api_key: string | null;
    _hasKeys: Record<string, boolean>;
  }

  interface Props {
    configId: string;
    keys: KeysData | null;
  }

  let { configId, keys }: Props = $props();

  const providers = [
    { field: "openai_api_key" as const, label: "OpenAI" },
    { field: "openai_gpt5_api_key" as const, label: "OpenAI GPT-5" },
    { field: "azure_openai_api_key" as const, label: "Azure OpenAI" },
    { field: "perplexity_api_key" as const, label: "Perplexity" },
    { field: "anthropic_api_key" as const, label: "Anthropic (Claude)" },
    { field: "gemini_api_key" as const, label: "Google Gemini" },
    { field: "speech_api_key" as const, label: "Azure Speech" },
    { field: "elevenLabs_api_key" as const, label: "ElevenLabs" },
    { field: "fal_ai_api_key" as const, label: "Fal.ai (Flux)" },
  ] as const;

  let formData = $state<Record<string, string>>({});
  let visibility = $state<Record<string, boolean>>({});
  let loading = $state(false);

  // Initialize form data from keys prop
  for (const p of providers) {
    formData[p.field] = keys?.[p.field] ?? "";
    visibility[p.field] = false;
  }

  function isConfigured(field: string): boolean {
    return keys?._hasKeys?.[field] ?? false;
  }

  function toggleVisibility(field: string) {
    visibility[field] = !visibility[field];
  }

  async function save() {
    if (!configId) {
      addToast({ message: t("global-api-keys.update-failed"), type: "error" });
      return;
    }

    loading = true;
    try {
      const payload: Record<string, string | null> = { _id: configId };
      for (const p of providers) {
        const value = formData[p.field];
        if (value === undefined) continue;
        payload[p.field] = value || null;
      }

      const { data, error } = await actions.globalApiKeys.update(payload);

      if (error || (data && !data.success)) {
        addToast({
          message: t("global-api-keys.update-failed"),
          type: "error",
        });
      } else {
        addToast({
          message: t("global-api-keys.update-success"),
          type: "success",
        });
        // Reload to get fresh masked values
        window.location.reload();
      }
    } catch (e) {
      addToast({ message: t("global-api-keys.update-failed"), type: "error" });
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={preventDefault(save)}>
  <div class="bg-base-200 rounded-lg p-6 space-y-3">
    {#each providers as provider}
      <div
        class="flex items-center gap-4 bg-base-100 rounded-lg px-4 py-3"
      >
        <!-- Status dot + Provider name -->
        <div class="flex items-center gap-2 min-w-48">
          {#if isConfigured(provider.field)}
            <span class="badge badge-success badge-xs"></span>
          {:else}
            <span class="badge badge-ghost badge-xs"></span>
          {/if}
          <span class="font-medium">{provider.label}</span>
        </div>

        <!-- API Key input -->
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <input
            type={visibility[provider.field] ? "text" : "password"}
            class="grow"
            placeholder={isConfigured(provider.field)
              ? t("global-api-keys.configured")
              : t("global-api-keys.not-configured")}
            bind:value={formData[provider.field]}
          />
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            onclick={() => toggleVisibility(provider.field)}
          >
            {#if visibility[provider.field]}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4"
              >
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path
                  fill-rule="evenodd"
                  d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
                  clip-rule="evenodd"
                />
                <path
                  d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41a1.651 1.651 0 010-1.186 10.007 10.007 0 012.89-4.036L6.18 7.993a4 4 0 004.568 5.937z"
                />
              </svg>
            {/if}
          </button>
        </label>
      </div>
    {/each}
  </div>

  <div class="mt-6">
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {#if loading}
        <Loading />
      {/if}
      {t("common.save")}
    </button>
  </div>
</form>
