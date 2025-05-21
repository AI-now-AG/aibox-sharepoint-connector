<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore event_directive_deprecated -->
<script lang="ts">
  import { SubscriptionStep } from "$types/Subscription";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    orientation?: "horizontal" | "vertical";
    currentStep?: number;
    defaultLanguage?: string;
  }

  let {
    currentStep = $bindable(0),
    orientation = "horizontal",
    defaultLanguage = "en",
  }: Props = $props();

  let cssClasses = $state(
    orientation === "horizontal"
      ? "steps steps-horizontal text-gray-400 text-sm font-sans font-semibold"
      : "steps steps-vertical text-gray-400 text-sm font-sans font-semibold",
  );

  const t = useTranslations(defaultLanguage);
  const step1Text = t("subscription.step1");
  const step2Text = t("subscription.step2");
  const step3Text = t("subscription.step3");
  const step4Text = t("subscription.step4");

  const handleClickOnStep = (step: number) => {
    if (
      currentStep <= SubscriptionStep.Step0 ||
      currentStep >= SubscriptionStep.Step4 ||
      currentStep <= step
    ) {
      return;
    }

    if (step > SubscriptionStep.Step0 && step < SubscriptionStep.Step4) {
      window.location.href = `/subscription/step${step}`;
    }
  };
</script>

<ul class={cssClasses}>
  {#if currentStep === SubscriptionStep.Step0}
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step1)}>
      {step1Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step2)}>
      {step2Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step3)}>
      {step3Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step4)}>
      {step4Text}
    </li>
  {:else if currentStep === SubscriptionStep.Step1}
    <li
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step1)}
    >
      {step1Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step2)}>
      {step2Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step3)}>
      {step3Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step4)}>
      {step4Text}
    </li>
  {:else if currentStep === SubscriptionStep.Step2}
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step1)}
    >
      {step1Text}
    </li>
    <li
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step2)}
    >
      {step2Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step3)}>
      {step3Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step4)}>
      {step4Text}
    </li>
  {:else if currentStep === SubscriptionStep.Step3}
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step1)}
    >
      {step1Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step2)}
    >
      {step2Text}
    </li>
    <li
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step3)}
    >
      {step3Text}
    </li>
    <li class="step" on:click={() => handleClickOnStep(SubscriptionStep.Step4)}>
      {step4Text}
    </li>
  {:else if currentStep === SubscriptionStep.Step4}
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step1)}
    >
      {step1Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step2)}
    >
      {step2Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step3)}
    >
      {step3Text}
    </li>
    <li
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step4)}
    >
      {step4Text}
    </li>
  {:else if currentStep === SubscriptionStep.Completed}
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step1)}
    >
      {step1Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step2)}
    >
      {step2Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step3)}
    >
      {step3Text}
    </li>
    <li
      data-content="✓"
      class="step step-primary text-white"
      on:click={() => handleClickOnStep(SubscriptionStep.Step4)}
    >
      {step4Text}
    </li>
  {/if}
</ul>

<style>
  :global(.steps .step) {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background-color: transparent !important;
    cursor: pointer !important;
  }

  :global(.steps .steps-horizontal .step) {
    text-align: left !important;
  }

  :global(.steps .steps-vertical .step) {
    text-align: center !important;
  }

  :global(.steps .step:before) {
    background-color: #d7dde4 !important;
    border-color: #d7dde4 !important;
  }

  :global(.steps .step-primary + .step-primary:before) {
    background-color: white !important;
  }

  :global(.steps .step:not(:has(.step-icon)):after) {
    background-color: #d7dde4 !important;
    border: 1px solid #d7dde4 !important;
    color: white !important;
    font-size: 14px !important;
  }

  :global(.steps .step-primary:not(:has(.step-icon)):after) {
    background-color: white !important;
    border: 1px solid white !important;
    color: #491eff !important;
    font-size: 14px !important;
  }
</style>
