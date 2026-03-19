<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import type { TagItem } from "$types/Subscription";
  import { useTranslations } from "$i18n/utils";
  import { user, tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import { PromptToolOption } from "$types/AIProvider";
  import FormView from "./FormView.svelte";
  import ProcessingView from "./ProcessingView.svelte";
  import SuccessView from "./SuccessView.svelte";
  import {
    posthogClientCaptureGlobal,
    posthogClientCaptureException,
  } from "$utils/posthogClient";
  import { EventName, ScreenName } from "$types/Posthog";

  interface Props {
    tags: TagItem[];
    promptKbInstruction?: string; // overrides DEFAULT_KB_INSTRUCTION if provided
    industryInstruction?: string; // overrides DEFAULT_INDUSTRY_INSTRUCTION if provided
  }

  let { promptKbInstruction, industryInstruction, tags = [] }: Props = $props();

  const t = useTranslations();

  // ── View ───────────────────────────────────────────────────────────────────
  const View = {
    Form: "form",
    Processing: "processing",
    Success: "success",
  } as const;
  type View = (typeof View)[keyof typeof View];

  let currentView: View = $state(View.Form);

  // Track when the onboarding page is first shown
  onMount(() => {
    posthogClientCaptureGlobal(EventName.AiboxOnboardingNew, {
      page_name: ScreenName.Onboarding,
    });
  });

  // ── Form state ─────────────────────────────────────────────────────────────
  let organizationName = $state("");
  let websiteUrl = $state("");
  let selectedTag = $state(""); // set by user in FormView or auto-detected in analyseWebsite

  // Human-readable tag title derived from selectedTag value
  const selectedTagName = $derived(
    tags.find((tag) => tag.value === selectedTag)?.title ?? "",
  );

  // ── Result — mutated by step closures, read by SuccessView ─────────────────
  interface OnboardingResult {
    assistants: number;
    pagesAnalysed: number;
    knowledgeBases: number;
  }

  let result: OnboardingResult = $state({
    assistants: 0,
    pagesAnalysed: 0,
    knowledgeBases: 0,
  });

  // ── Pipeline context — plain let, shared between step closures ─────────────
  // Sequential runner guarantees write-before-read; no $state needed.
  let newTenantId: string | null = null; // set by createAibox, used by createKB + configureAssistants
  let kbContent: string = ""; // set by analyseWebsite, used by createKB
  let industryContent: string = ""; // set by analyseWebsite, used by resolveTag
  let newKbId: string | null = null; // set by createKB, used by configureAssistants

  // ── Default prompts (fallback when not provided via props) ─────────────────
  const DEFAULT_KB_INSTRUCTION = `
    Generate a short company overview in the website's language. Include key info (products, customers, value).
    Keep it clear and concise.
  `;

  const DEFAULT_INDUSTRY_INSTRUCTION = `
    Classify the company based on its website.
    Check sections like "About Us" or "Services" and determine the main industry.
    Respond only in this format:
    <industry>Value</industry>
  `;

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Calls the AI prompt API with retry logic (up to 3 attempts, exponential back-off).
  // Returns extracted text and optional URL citations.
  async function executePrompt(
    systemMessage: string,
    prompt: string,
  ): Promise<{
    text: string;
    citations?: any[];
  }> {
    const MAX_RETRIES = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${TRANSCRIPTION_API_URL}/api/prompt/execute`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${$user?.api_token}`,
            },
            body: JSON.stringify({
              tenantId: $tenant?._id?.toString(),
              provider: PromptModel.Gemini,
              systemMessage: [systemMessage],
              prompt,
              tool: PromptToolOption.UrlContext,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const json = await response.json();
        const { response: content, citations } = json.data;
        const text = Array.isArray(content)
          ? (content.at(-1)?.text ?? "")
          : (content ?? "");
        if (!text) throw new Error("Empty response from API");

        return { text, citations };
      } catch (err) {
        lastError = err;
        console.error(
          `SelfOnboarding -> executePrompt() attempt ${attempt}/${MAX_RETRIES} failed:`,
          err,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // back-off: 1s, 2s
        }
      }
    }

    // All retries exhausted — surface user-facing message with last error detail
    throw new Error(
      `${t("self-onboarding.error-analyse-website")} — ${lastError instanceof Error ? lastError.message : lastError}`,
    );
  }

  // Reads industryContent (set by analyseWebsite) and matches it against available tags.
  // Falls back to "KMU generell" if no match is found or industryContent is empty.
  function resolveTag(): string {
    const FALLBACK_TAG_NAME = "KMU generell";
    const fallback = tags.find((tag) => tag.title === FALLBACK_TAG_NAME);

    const match = industryContent.match(/<industry>(.*?)<\/industry>/i);
    if (match) {
      const detected = match[1].trim().toLowerCase();
      // Try exact match first, then partial match
      const matched =
        tags.find((tag) => tag.title.toLowerCase() === detected) ??
        tags.find(
          (tag) =>
            tag.title.toLowerCase().includes(detected) ||
            detected.includes(tag.title.toLowerCase()),
        );
      return matched?.value ?? fallback?.value ?? "";
    }
    return fallback?.value ?? "";
  }

  // ── Step functions ─────────────────────────────────────────────────────────

  // Step 1 (URL flow only): fetches KB content + detects industry from the website.
  async function analyseWebsite(): Promise<void> {
    // Fetch company overview for the knowledge base
    const { text: kbText, citations: kbCitations } = await executePrompt(
      promptKbInstruction || DEFAULT_KB_INSTRUCTION,
      `Company: ${organizationName}\nWebsite: ${websiteUrl}`,
    );
    kbContent = kbText;
    result.pagesAnalysed = kbCitations?.length
      ? new Set(kbCitations.flatMap((c) => c.sources?.map((s: any) => s.uri)))
          .size
      : 1;

    // Fetch industry classification to auto-select the industry tag
    const { text: industryText } = await executePrompt(
      industryInstruction || DEFAULT_INDUSTRY_INSTRUCTION,
      `Website URL: ${websiteUrl}`,
    );
    industryContent = industryText;
    selectedTag = resolveTag();

    console.info("SelfOnboarding -> analyseWebsite() done", {
      kbContent,
      citations: kbCitations,
      industryContent,
      selectedTag: selectedTagName,
    });
  }

  // Step 2: creates the Auth0 org, adds the user, and initialises the tenant.
  async function createAibox(): Promise<void> {
    // 1. Create Auth0 organisation
    const { data: orgResult, error: orgError } =
      await actions.onboarding.createOrganization({
        organization_name: organizationName,
      });

    if (orgError || !orgResult) {
      console.error("SelfOnboarding -> createAibox() failed", orgError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }
    console.info("SelfOnboarding -> createAibox() org created", orgResult.id);

    // 2. Move the current user into the new organisation
    const { error: assignError } =
      await actions.onboarding.assignUserToOrganization({
        org_id: orgResult.id,
      });

    if (assignError) {
      console.error("SelfOnboarding -> createAibox() failed", assignError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }
    console.info(
      "SelfOnboarding -> createAibox() user assigned to org",
      orgResult.id,
    );

    // 3. Clone master tenant and create subscription
    const { data: tenantResult, error: tenantError } =
      await actions.onboarding.initializeTenant({
        org_name: organizationName,
        org_id: orgResult.id,
      });

    if (tenantError || !tenantResult) {
      console.error("SelfOnboarding -> createAibox() failed", tenantError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }

    newTenantId = tenantResult.id;
    console.info(
      "SelfOnboarding -> createAibox() tenant initialised",
      newTenantId,
    );
  }

  // Step 3 (URL flow only): creates the knowledge base entry from scraped content.
  async function createKB(): Promise<void> {
    const { data, error } = await actions.onboarding.createTenantKnowledgeBase({
      tenant_id: newTenantId!,
      org_name: organizationName,
      content: kbContent,
    });

    if (error) {
      console.error("SelfOnboarding -> createKB() failed", error);
      throw new Error(t("self-onboarding.error-create-kb"));
    }

    newKbId = data.id;
    result.knowledgeBases = data.insertedCount;
    console.info("SelfOnboarding -> createKB() done", {
      id: newKbId,
      knowledgeBases: result.knowledgeBases,
    });
  }

  // Step 4: clones global prompt categories/templates for the selected industry tag.
  // Falls back to resolveTag() if the user didn't pick an industry manually.
  async function configureAssistants(): Promise<void> {
    if (!selectedTag) {
      selectedTag = resolveTag(); // fallback when URL step was skipped
    }

    const { data, error } = await actions.onboarding.configureAssistants({
      tenant_id: newTenantId!,
      tag_id: selectedTag,
      kb_id: newKbId || "",
    });

    if (error) {
      console.error("SelfOnboarding -> configureAssistants() failed", error);
      throw new Error(t("self-onboarding.error-configure-assistants"));
    }

    result.assistants = data.insertedCount;
    console.info("SelfOnboarding -> configureAssistants() done", {
      assistants: result.assistants,
      selectedTag: selectedTagName,
    });
  }

  // Step 5: sends notification emails to support and the user.
  async function finalizeSetup(): Promise<void> {
    const { error } = await actions.onboarding.finalizeOnboarding({
      tenant_id: newTenantId!,
      tag_name: selectedTagName,
    });

    if (error) {
      console.error("SelfOnboarding -> finalizeSetup() failed", error);
      throw new Error(t("self-onboarding.error-finalize-setup"));
    }

    console.info(
      "SelfOnboarding -> finalizeSetup() done — onboarding complete",
    );
  }

  // ── View handlers ──────────────────────────────────────────────────────────
  function handleCreate(): void {
    currentView = View.Processing;
  }

  function handleComplete(): void {
    posthogClientCaptureGlobal(EventName.AiboxOnboardingCreated, {
      page_name: ScreenName.Onboarding,
    });
    currentView = View.Success;
  }

  function handleError(err: unknown, stepKey: string): void {
    posthogClientCaptureException(err, {
      stepKey,
      organizationName,
    });
  }

  // ── Steps — $derived so label translations stay reactive ──────────────────
  interface StepConfig {
    key: string;
    label: string;
    run: () => Promise<void>;
  }

  // 5 steps when a URL is provided (includes website analysis + KB creation).
  // 3 steps without URL (aibox creation, assistants, finalize only).
  const steps = $derived<StepConfig[]>(
    websiteUrl.trim()
      ? [
          {
            key: "analyse-website",
            label: t("self-onboarding.step-analyse-website"),
            run: analyseWebsite,
          },
          {
            key: "create-aibox",
            label: t("self-onboarding.step-create-aibox"),
            run: createAibox,
          },
          {
            key: "create-kb",
            label: t("self-onboarding.step-create-kb"),
            run: createKB,
          },
          {
            key: "configure-assistants",
            label: t("self-onboarding.step-configure-assistants"),
            run: configureAssistants,
          },
          {
            key: "finalize-setup",
            label: t("self-onboarding.step-finalize-setup"),
            run: finalizeSetup,
          },
        ]
      : [
          {
            key: "create-aibox",
            label: t("self-onboarding.step-create-aibox"),
            run: createAibox,
          },
          {
            key: "configure-assistants",
            label: t("self-onboarding.step-configure-assistants"),
            run: configureAssistants,
          },
          {
            key: "finalize-setup",
            label: t("self-onboarding.step-finalize-setup"),
            run: finalizeSetup,
          },
        ],
  );
</script>

<div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
  {#if currentView === View.Form}
    <FormView
      {tags}
      bind:organizationName
      bind:websiteUrl
      bind:selectedTag
      oncreate={handleCreate}
    />
  {:else if currentView === View.Processing}
    <ProcessingView {steps} oncomplete={handleComplete} onerror={handleError} />
  {:else if currentView === View.Success}
    <SuccessView {result} {organizationName} {selectedTagName} />
  {/if}
</div>
