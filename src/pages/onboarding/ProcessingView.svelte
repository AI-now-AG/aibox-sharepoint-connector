<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  interface Props {
    websiteUrl: string;
    oncomplete: () => void;
  }

  let { websiteUrl, oncomplete }: Props = $props();

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
        { key: "analyse-website",      label: t("self-onboarding.step-analyse-website") },
        { key: "create-aibox",         label: t("self-onboarding.step-create-aibox") },
        { key: "create-kb",            label: t("self-onboarding.step-create-kb") },
        { key: "configure-assistants", label: t("self-onboarding.step-configure-assistants") },
        { key: "finalize-setup",       label: t("self-onboarding.step-finalize-setup") },
      ]
    : [
        { key: "create-aibox",         label: t("self-onboarding.step-create-aibox") },
        { key: "configure-assistants", label: t("self-onboarding.step-configure-assistants") },
        { key: "finalize-setup",       label: t("self-onboarding.step-finalize-setup") },
      ];

  // currentStepIndex drives both the step status icons and the progress bar.
  // Value n means steps 0…n-1 are Completed, step n is Active, n+1… are Pending.
  // When n === stepDefs.length all steps are Completed and we transition away.
  let currentStepIndex = $state(0);
  let error = $state<string | null>(null);

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

  // ── API stubs — replace body with real fetch/action call later ─────────────
  const STUB_DELAY_MS = 1500;
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  async function analyseWebsite(): Promise<void> {
    // TODO: POST /api/onboarding/analyse-website  { websiteUrl }
    await delay(STUB_DELAY_MS);
  }

  async function createAibox(): Promise<void> {
    // TODO: POST /api/onboarding/create-aibox
    await delay(STUB_DELAY_MS);
  }

  async function createKB(): Promise<void> {
    // TODO: POST /api/onboarding/create-kb
    await delay(STUB_DELAY_MS);
  }

  async function configureAssistants(): Promise<void> {
    // TODO: POST /api/onboarding/configure-assistants
    await delay(STUB_DELAY_MS);
  }

  async function finalizeSetup(): Promise<void> {
    // TODO: POST /api/onboarding/finalize-setup
    await delay(STUB_DELAY_MS);
  }

  // Map each step key to its handler so the runner stays generic
  const stepHandlers: Record<string, () => Promise<void>> = {
    "analyse-website":      analyseWebsite,
    "create-aibox":         createAibox,
    "create-kb":            createKB,
    "configure-assistants": configureAssistants,
    "finalize-setup":       finalizeSetup,
  };

  // ── Sequential runner — starts on mount, respects unmount via cancelled flag ─
  $effect(() => {
    let cancelled = false;

    async function run() {
      try {
        for (let i = 0; i < stepDefs.length; i++) {
          if (cancelled) return;
          currentStepIndex = i;                       // mark step as Active
          await stepHandlers[stepDefs[i].key]?.();
        }
        if (cancelled) return;
        currentStepIndex = stepDefs.length;           // mark all as Completed
        oncomplete();
      } catch (err) {
        if (!cancelled) {
          error = err instanceof Error ? err.message : "An unexpected error occurred";
        }
      }
    }

    run();
    return () => { cancelled = true; };
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
  <div class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-600">
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
        <div class="w-6 h-6 flex items-center justify-center shrink-0">
          <div class="relative flex items-center justify-center">
            <div
              class="absolute w-2.5 h-2.5 rounded-full animate-ping opacity-75"
              style="background-color: #491EFF;"
            ></div>
            <div
              class="w-2.5 h-2.5 rounded-full"
              style="background-color: #491EFF;"
            ></div>
          </div>
        </div>

      {:else}
        <!-- Pending -->
        <div class="w-6 h-6 rounded-full bg-gray-200 shrink-0"></div>
      {/if}

      <!-- Label -->
      <span
        class={`text-sm font-semibold ${
          step.status === StepStatus.Pending ? "text-gray-400" : "text-[#491EFF]"
        }`}
      >
        {step.label}
      </span>

    </li>
  {/each}
</ul>
