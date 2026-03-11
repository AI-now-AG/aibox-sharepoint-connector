<script lang="ts">
  import { actions } from "astro:actions";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { tenant, user } from "$stores";
  import { addToast } from "$stores/toast";
  import { useTranslations } from "$i18n/utils";
  import { isValidUrl } from "$utils/validation";
  import { PromptModel } from "$types/PromptModel";
  import { PromptToolOption } from "$types/AIProvider";
  import Loading from "$components/Loading.svelte";

  const t = useTranslations();

  interface Props {
    modal: HTMLDialogElement | undefined;
    tenantId: string;
    promptKbInstruction?: string;
    onModalClosed?: () => void;
  }

  let {
    modal = $bindable(),
    tenantId,
    promptKbInstruction = "",
    onModalClosed,
  }: Props = $props();

  type Step = "form" | "success";
  let step: Step = $state("form");
  let loading = $state(false);

  // Pre-filled from tenant store — both are editable
  let companyName = $state($tenant?.billing_info?.company_name ?? "");
  let websiteUrl = $state($tenant?.website ?? "");

  const canGenerate = $derived(
    companyName.trim().length > 0 && isValidUrl(websiteUrl),
  );

  const DEFAULT_PROMPT_KB_INSTRUCTION = `
    You are a research assistant. Generate a comprehensive company overview in the same language as the company's website.
    Include: company overview, main products and services, target customers, unique value propositions, and any other relevant information.
    Format the output as clear structured text suitable for an internal knowledge base.
    Be factual and concise.
  `;

  function reset() {
    step = "form";
    companyName = $tenant?.billing_info?.company_name ?? "";
    websiteUrl = $tenant?.website ?? "";
    loading = false;
  }

  function closeDialog() {
    modal?.close();
    reset();
    onModalClosed?.();
  }

  async function generateFromUrl() {
    if (!canGenerate) return;
    loading = true;

    const executePromptUrl = `${TRANSCRIPTION_API_URL}/api/prompt/execute`;
    const accessToken = $user?.api_token as string;
    const payload = {
      tenantId,
      provider: PromptModel.Gemini,
      systemMessage: [promptKbInstruction || DEFAULT_PROMPT_KB_INSTRUCTION],
      prompt: `Company: ${companyName}\nWebsite: ${websiteUrl}`,
      tool: PromptToolOption.Websearch,
    };

    let kbContent = "";
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(executePromptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        kbContent = result.data.response;
        if (!kbContent) throw new Error("Empty response content from API");
        break;
      } catch (err) {
        console.warn(
          `[AddKbDialog] Attempt ${attempt}/${MAX_RETRIES} failed:`,
          err,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    const { data, error } =
      await actions.tenantCreation.createTenantKnowledgeBase({
        tenant_id: tenantId,
        company_name: companyName,
        content: kbContent,
      });

    loading = false;

    if (error) {
      addToast({ message: t("kb.add-dialog.create-failed"), type: "error" });
      return;
    }

    step = "success";
  }
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box max-w-lg">
    <form method="dialog">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        onclick={reset}>✕</button
      >
    </form>

    <h3 class="text-lg font-bold mb-4">{t("kb.add-dialog.title")}</h3>

    {#if step === "form"}
      <div class="space-y-4">
        <!-- Company name — read-only from tenant -->
        <div>
          <label
            class="mb-2 text-base-content font-medium text-sm"
            for="kb-company-name"
          >
            <span class="label-text font-medium"
              >{t("kb.add-dialog.company-name-label")}</span
            >
          </label>
          <input
            id="kb-company-name"
            type="text"
            class="input input-bordered w-full"
            placeholder="e.g. AI Now AG"
            bind:value={companyName}
          />
        </div>

        <!-- Website URL — editable, pre-filled from tenant -->
        <div>
          <label
            class="mb-2 text-base-content font-medium text-sm"
            for="kb-website-url"
          >
            <span class="label-text font-medium"
              >{t("kb.add-dialog.website-url-label")}</span
            >
          </label>
          <input
            id="kb-website-url"
            type="text"
            class="input input-bordered w-full"
            placeholder="e.g. ainow.ch"
            bind:value={websiteUrl}
          />
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="btn btn-primary"
            onclick={generateFromUrl}
            disabled={loading || !canGenerate}
          >
            {t("kb.add-dialog.generate-button")}
          </button>
        </div>
      </div>
    {:else if step === "success"}
      <div class="text-center space-y-4 py-4">
        <div class="text-5xl">✅</div>
        <p class="text-lg font-semibold">{t("kb.add-dialog.success-title")}</p>
        <p class="text-base-content/70">{t("kb.add-dialog.success-message")}</p>
        <button class="btn btn-primary w-full mt-4" onclick={closeDialog}>
          {t("common.close")}
        </button>
      </div>
    {/if}
  </div>

</dialog>

<Loading show={loading} />
