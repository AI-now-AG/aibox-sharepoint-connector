<script lang="ts">
  import { actions } from "astro:actions";
  import { TRANSCRIPTION_API_URL } from "astro:env/client";
  import { useTranslations } from "$i18n/utils";
  import { user, tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import { PromptToolOption } from "$types/AIProvider";
  import type { TagItem } from "$types/Subscription";

  interface Props {
    tags: TagItem[];
    organizationName: string;
    websiteUrl: string;
    selectedTag?: string;
    oncomplete: () => void;
  }

  let {
    tags = [],
    organizationName,
    websiteUrl,
    selectedTag,
    oncomplete,
  }: Props = $props();

  const t = useTranslations();

  // ── Step status ────────────────────────────────────────────────────────────
  const StepStatus = {
    Completed: "completed",
    Active: "active",
    Pending: "pending",
  } as const;
  type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

  interface StepDef {
    key: string;
    label: string;
  }

  interface Step extends StepDef {
    status: StepStatus;
  }

  // ── Step definitions (depend on whether a website was provided) ────────────
  const stepDefs: StepDef[] = websiteUrl.trim()
    ? [
        {
          key: "analyse-website",
          label: t("self-onboarding.step-analyse-website"),
        },
        { key: "create-aibox", label: t("self-onboarding.step-create-aibox") },
        { key: "create-kb", label: t("self-onboarding.step-create-kb") },
        {
          key: "configure-assistants",
          label: t("self-onboarding.step-configure-assistants"),
        },
        {
          key: "finalize-setup",
          label: t("self-onboarding.step-finalize-setup"),
        },
      ]
    : [
        { key: "create-aibox", label: t("self-onboarding.step-create-aibox") },
        {
          key: "configure-assistants",
          label: t("self-onboarding.step-configure-assistants"),
        },
        {
          key: "finalize-setup",
          label: t("self-onboarding.step-finalize-setup"),
        },
      ];

  // currentStepIndex drives both the step status icons and the progress bar.
  // Value n means steps 0…n-1 are Completed, step n is Active, n+1… are Pending.
  // When n === stepDefs.length all steps are Completed and we transition away.
  let currentStepIndex = $state(0);
  let error = $state<string | null>(null);

  // Set by createAibox, consumed by all subsequent steps.
  // Set by analyseWebsite, consumed by createKB.
  // Plain let is fine — the runner is sequential so values are always written before read.
  let newTenantId: string | null = null;
  let kbContent: string = "";

  const DEFAULT_KB_INSTRUCTION = `
    Generate a short company overview in the website’s language. Include key info (products, customers, value). 
    Keep it clear and concise.
  `;

  const steps: Step[] = $derived(
    stepDefs.map((def, i) => ({
      ...def,
      status:
        i < currentStepIndex
          ? StepStatus.Completed
          : i === currentStepIndex
            ? StepStatus.Active
            : StepStatus.Pending,
    })),
  );

  const progressPercent = $derived((currentStepIndex / stepDefs.length) * 100);

  // ── Remaining stubs (configureAssistants, finalizeSetup) ──────────────────
  const STUB_DELAY_MS = 1500;
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  async function analyseWebsite(): Promise<void> {
    const executePromptUrl = `${TRANSCRIPTION_API_URL}/api/prompt/execute`;
    const accessToken = $user?.api_token as string;

    const payload = {
      tenantId: $tenant?._id?.toString(),
      provider: PromptModel.Gemini,
      systemMessage: [DEFAULT_KB_INSTRUCTION],
      prompt: `Company: ${organizationName}\nWebsite: ${websiteUrl}`,
      tool: PromptToolOption.UrlContext,
    };

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
    const { response: content } = result.data;
    console.log("[ProcessingView] analyseWebsite response", { content });

    kbContent = Array.isArray(content)
      ? (content.at(-1)?.text ?? "")
      : (content ?? "");

    throw Error(kbContent);
  }

  async function createAibox(): Promise<void> {
    const { data: orgResult, error: orgError } =
      await actions.onboarding.createOrganization({
        organization_name: organizationName,
      });

    if (orgError) throw new Error(t("subscription.create-organization-failed"));
    if (!orgResult)
      throw new Error(t("subscription.create-organization-failed"));

    const { error: assignError } =
      await actions.onboarding.assignUserToOrganization({
        org_id: orgResult.id,
      });

    if (assignError) throw new Error(t("subscription.create-memeber-failed"));

    const { data: tenantResult, error: tenantError } =
      await actions.onboarding.initializeTenant({
        org_name: organizationName,
        org_id: orgResult.id,
      });

    if (tenantError)
      throw new Error(t("subscription.setup-tenant-data-failed"));

    newTenantId = tenantResult._id;
  }

  async function createKB(): Promise<void> {
    const { error } = await actions.tenantCreation.createTenantKnowledgeBase({
      tenant_id: newTenantId!,
      company_name: organizationName,
      content: kbContent,
    });

    if (error) throw new Error(t("kb.add-dialog.create-failed"));
  }

  async function configureAssistants(): Promise<void> {
    // TODO: POST /api/onboarding/configure-assistants  { tenantId: newTenantId }
    await delay(STUB_DELAY_MS);
  }

  async function finalizeSetup(): Promise<void> {
    // TODO: POST /api/onboarding/finalize-setup  { tenantId: newTenantId }
    await delay(STUB_DELAY_MS);
  }

  // Map each step key to its handler so the runner stays generic
  const stepHandlers: Record<string, () => Promise<void>> = {
    "analyse-website": analyseWebsite,
    "create-aibox": createAibox,
    "create-kb": createKB,
    "configure-assistants": configureAssistants,
    "finalize-setup": finalizeSetup,
  };

  // ── Sequential runner — starts on mount, respects unmount via cancelled flag ─
  $effect(() => {
    let cancelled = false;

    async function run() {
      try {
        for (let i = 0; i < stepDefs.length; i++) {
          if (cancelled) return;
          currentStepIndex = i; // mark step as Active
          await stepHandlers[stepDefs[i].key]?.();
        }
        if (cancelled) return;
        currentStepIndex = stepDefs.length; // mark all as Completed
        oncomplete();
      } catch (err) {
        if (!cancelled) {
          error =
            err instanceof Error ? err.message : "An unexpected error occurred";
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  });
</script>

<!-- Header -->
<div class="flex items-center gap-3 mb-2">
  <img src="/favicon.svg" alt="aibox" class="w-9 h-9 rounded-lg" />
  <h1 class="text-2xl font-bold text-gray-900">
    {t("self-onboarding.processing-title")}
  </h1>
</div>

<p class="text-sm text-gray-500 mb-8">
  {t("self-onboarding.processing-subtitle")}
</p>

<!-- Progress bar -->
<div class="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
  <div
    class="h-full rounded-full transition-all duration-700 ease-in-out"
    style={`width: ${progressPercent}%; background-color: #491EFF;`}
  ></div>
</div>

<!-- Error state -->
{#if error}
  <div
    class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-600"
  >
    {error}
  </div>
{/if}

<!-- Step list -->
<ul class="space-y-5">
  {#each steps as step}
    <li class="flex items-center gap-4">
      <!-- Status icon -->
      {#if step.status === StepStatus.Completed}
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
          style="background-color: #22C55E; font-size: 11px;"
        >
          ✓
        </div>
      {:else if step.status === StepStatus.Active}
        <!-- Pulsing dot, no border while animating -->
        <div
          class="w-6 h-6 flex items-center justify-center rounded-full bg-primary/80 shrink-0"
        >
          <div class="relative flex items-center justify-center">
            <div
              class="absolute w-6 h-6 rounded-full animate-ping opacity-75"
              style="background-color: #491EFF;"
            ></div>
            <div
              class="w-2.5 h-2.5 rounded-full"
              style="background-color: #eee;"
            ></div>
          </div>
        </div>
      {:else}
        <!-- Pending -->
        <div
          class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 shrink-0"
        >
          <div class="relative flex items-center justify-center">
            <div
              class="w-2.5 h-2.5 rounded-full"
              style="background-color: #ccc;"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Label -->
      <span
        class={`text-sm font-semibold ${
          step.status === StepStatus.Pending
            ? "text-gray-400"
            : "text-[#491EFF]"
        }`}
      >
        {step.label}
      </span>
    </li>
  {/each}
</ul>
