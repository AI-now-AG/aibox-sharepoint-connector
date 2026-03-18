<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  interface StepConfig {
    key: string;
    label: string;
    run: () => Promise<void>;
  }

  interface Props {
    steps: StepConfig[];
    oncomplete: () => void;
  }

  let { steps, oncomplete }: Props = $props();

  const t = useTranslations();

  // ── Step status ────────────────────────────────────────────────────────────
  const StepStatus = {
    Completed: "completed",
    Active: "active",
    Pending: "pending",
  } as const;
  type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

  // currentStepIndex drives status icons and progress bar.
  // n means steps 0…n-1 are Completed, step n is Active, n+1… are Pending.
  // When n === steps.length all steps are Completed.
  let currentStepIndex = $state(0);
  let error = $state<string | null>(null);

  const progressPercent = $derived((currentStepIndex / steps.length) * 100);

  function stepStatus(i: number): StepStatus {
    if (i < currentStepIndex) return StepStatus.Completed;
    if (i === currentStepIndex) return StepStatus.Active;
    return StepStatus.Pending;
  }

  // ── Sequential runner — starts on mount, respects unmount via cancelled flag ─
  $effect(() => {
    let cancelled = false;

    async function run() {
      try {
        for (let i = 0; i < steps.length; i++) {
          if (cancelled) return;
          currentStepIndex = i;
          await steps[i].run();
        }
        if (cancelled) return;
        currentStepIndex = steps.length;
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
  {#each steps as step, i}
    {@const status = stepStatus(i)}
    <li class="flex items-center gap-4">
      <!-- Status icon -->
      {#if status === StepStatus.Completed}
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
          style="background-color: #22C55E; font-size: 11px;"
        >
          ✓
        </div>
      {:else if status === StepStatus.Active}
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
        class={`text-sm font-semibold ${status === StepStatus.Pending ? "text-gray-400" : "text-[#491EFF]"}`}
      >
        {step.label}
      </span>
    </li>
  {/each}
</ul>
