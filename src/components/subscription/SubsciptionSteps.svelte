<script lang="ts">
  import { useTranslations } from "$i18n/utils";

  interface Props {
    currentStep?: number;
  }

  let { currentStep = $bindable(0) }: Props = $props();
  const t = useTranslations();
  const step1Text = t("subscription.step1");
  const step2Text = t("subscription.step2");
  const step3Text = t("subscription.step3");
  const step4Text = t("subscription.step4");
</script>

<ul class="steps steps-vertical text-gray-400 text-sm font-sans font-semibold">
  {#if currentStep === 0}
    <li class="step">
      {step1Text}
    </li>
    <li class="step">
      {step2Text}
    </li>
    <li class="step">
      {step3Text}
    </li>
    <li class="step">
      {step4Text}
    </li>
  {:else if currentStep === 1}
    <li data-content="✓" class="step step-primary text-white">
      {step1Text}
    </li>
    <li class="step">
      {step2Text}
    </li>
    <li class="step">
      {step3Text}
    </li>
    <li class="step">
      {step4Text}
    </li>
  {:else if currentStep === 2}
    <li data-content="✓" class="step step-primary text-white">
      {step1Text}
    </li>
    <li class="step step-primary text-white">
      {step2Text}
    </li>
    <li class="step">
      {step3Text}
    </li>
    <li class="step">
      {step4Text}
    </li>
  {:else if currentStep === 3}
    <li data-content="✓" class="step step-primary text-white">
      {step1Text}
    </li>
    <li class="step step-primary text-white">
      {step2Text}
    </li>
    <li class="step step-primary text-white">
      {step3Text}
    </li>
    <li class="step">
      {step4Text}
    </li>
  {:else if currentStep === 4}
    <li data-content="✓" class="step step-primary text-white">
      {step1Text}
    </li>
    <li class="step step-primary text-white">
      {step2Text}
    </li>
    <li class="step step-primary text-white">
      {step3Text}
    </li>
    <li class="step step-primary text-white">
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
    text-align: left !important;
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
