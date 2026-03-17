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

  // Advances as each step completes; when === stepDefs.length all are done
  let currentStepIndex = $state(0);

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

  // Progress: 0 % at step 0, 100 % once all steps done
  const progressPercent = $derived((currentStepIndex / stepDefs.length) * 100);

  // ── Timer — starts on mount, cleans up on unmount ──────────────────────────
  const STEP_DURATION_MS = 1500;

  $effect(() => {
    const totalSteps = stepDefs.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= totalSteps; i++) {
      timers.push(
        setTimeout(() => {
          currentStepIndex = i; // i === totalSteps → all Completed, none Active
        }, i * STEP_DURATION_MS),
      );
    }

    // Brief "all done" pause before transitioning to success
    timers.push(
      setTimeout(
        () => {
          oncomplete();
        },
        (totalSteps + 1) * STEP_DURATION_MS,
      ),
    );

    return () => timers.forEach(clearTimeout);
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
        <!-- Pulsing dot, animating -->
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style="background-color: #491EFF; font-size: 11px;"
        >
          <div class="relative flex items-center justify-center">
            <div
              class="absolute w-6 h-6 rounded-full animate-ping opacity-75"
              style="background-color: #491EFF;"
            ></div>
            <div
              class="w-2.5 h-2.5 rounded-full"
              style="background-color: #dedde2;"
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
