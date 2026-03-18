<script lang="ts">
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

  interface Props {
    tags: TagItem[];
    promptKbInstruction?: string;
    industryInstruction?: string;
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

  // ── Form state ─────────────────────────────────────────────────────────────
  let organizationName = $state("");
  let websiteUrl = $state("");
  let selectedTag = $state("");

  const selectedTagTitle = $derived(
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
  // The runner is sequential so writes always precede reads.
  let newTenantId: string | null = null;
  let kbContent: string = "";
  let newKbId: string | null = null;

  const DEFAULT_KB_INSTRUCTION = `
    Generate a short company overview in the website's language. Include key info (products, customers, value).
    Keep it clear and concise.
  `;

  // ── Step functions ─────────────────────────────────────────────────────────
  async function analyseWebsite(): Promise<void> {
    const executePromptUrl = `${TRANSCRIPTION_API_URL}/api/prompt/execute`;
    const accessToken = $user?.api_token as string;

    const response = await fetch(executePromptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tenantId: $tenant?._id?.toString(),
        provider: PromptModel.Gemini,
        systemMessage: [promptKbInstruction || DEFAULT_KB_INSTRUCTION],
        prompt: `Company: ${organizationName}\nWebsite: ${websiteUrl}`,
        tool: PromptToolOption.UrlContext,
      }),
    });

    if (!response.ok) {
      console.warn(
        "SelfOnboarding -> analyseWebsite() failed",
        `HTTP ${response.status}: ${response.statusText}`,
      );
      throw new Error(
        `${t("self-onboarding.error-analyse-website")} - HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const json = await response.json();
    const { response: content } = json.data;
    kbContent = Array.isArray(content)
      ? (content.at(-1)?.text ?? "")
      : (content ?? "");

    const newResponse = await fetch(executePromptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tenantId: $tenant?._id?.toString(),
        provider: PromptModel.Gemini,
        systemMessage: [industryInstruction || DEFAULT_KB_INSTRUCTION],
        prompt: `Company: ${organizationName}\nWebsite: ${websiteUrl}`,
        tool: PromptToolOption.UrlContext,
      }),
    });

    if (!newResponse.ok) {
      console.warn(
        "SelfOnboarding -> analyseWebsite() failed",
        `HTTP ${response.status}: ${response.statusText}`,
      );
      throw new Error(
        `${t("self-onboarding.error-analyse-website")} - HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const newJson = await newResponse.json();
    const { response: newContent } = json.data;
    const aaa = Array.isArray(newContent)
      ? (newContent.at(-1)?.text ?? "")
      : (newContent ?? "");

    throw new Error(aaa);
  }

  async function createAibox(): Promise<void> {
    const { data: orgResult, error: orgError } =
      await actions.onboarding.createOrganization({
        organization_name: organizationName,
      });

    if (orgError || !orgResult) {
      console.warn("SelfOnboarding -> createAibox() failed", orgError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }

    const { error: assignError } =
      await actions.onboarding.assignUserToOrganization({
        org_id: orgResult.id,
      });

    if (assignError) {
      console.warn("SelfOnboarding -> createAibox() failed", assignError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }

    const { data: tenantResult, error: tenantError } =
      await actions.onboarding.initializeTenant({
        org_name: organizationName,
        org_id: orgResult.id,
      });

    if (tenantError || !tenantResult) {
      console.warn("SelfOnboarding -> createAibox() failed", tenantError);
      throw new Error(t("self-onboarding.error-create-aibox"));
    }

    newTenantId = tenantResult._id;
  }

  async function createKB(): Promise<void> {
    const { data, error } = await actions.onboarding.createTenantKnowledgeBase({
      tenant_id: newTenantId!,
      org_name: organizationName,
      content: kbContent,
    });

    if (error) {
      console.warn("SelfOnboarding -> createKB() failed", error);
      throw new Error(t("self-onboarding.error-create-kb"));
    }

    newKbId = data.id;
    result.knowledgeBases = data.insertedCount;
  }

  async function configureAssistants(): Promise<void> {
    const { data, error } = await actions.onboarding.configureAssistants({
      tenant_id: newTenantId!,
      tag_id: selectedTag,
      kb_id: newKbId || "",
    });

    if (error) {
      console.warn("SelfOnboarding -> configureAssistants() failed", error);
      throw new Error(t("self-onboarding.error-configure-assistants"));
    }

    result.knowledgeBases = data.insertedCount;
  }

  async function finalizeSetup(): Promise<void> {
    const { data, error } = await actions.onboarding.finalizeOnboarding({
      tenant_id: newTenantId!,
      tag_name: selectedTagTitle,
    });

    if (error) {
      console.warn("SelfOnboarding -> finalizeSetup() failed", error);
      throw new Error(t("self-onboarding.error-finalize-setup"));
    }

    result.knowledgeBases = data.insertedCount;
  }

  // ── Steps — $derived so label translations stay reactive ──────────────────
  interface StepConfig {
    key: string;
    label: string;
    run: () => Promise<void>;
  }

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
      oncreate={() => (currentView = View.Processing)}
    />
  {:else if currentView === View.Processing}
    <ProcessingView {steps} oncomplete={() => (currentView = View.Success)} />
  {:else if currentView === View.Success}
    <SuccessView {result} {organizationName} {selectedTagTitle} />
  {/if}
</div>
