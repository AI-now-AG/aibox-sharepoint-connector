<script lang="ts">
  import type { TagItem } from "$types/Subscription";
  import { useTranslations } from "$i18n/utils";
  import FormView from "./FormView.svelte";
  import ProcessingView from "./ProcessingView.svelte";
  import SuccessView from "./SuccessView.svelte";

  interface Props {
    tags: TagItem[];
  }

  let { tags = [] }: Props = $props();

  const t = useTranslations();

  // ── View ───────────────────────────────────────────────────────────────────
  const View = {
    Form: "form",
    Processing: "processing",
    Success: "success",
  } as const;
  type View = (typeof View)[keyof typeof View];

  let currentView: View = $state(View.Form);

  // ── Shared form state (passed down + needed by success view) ───────────────
  let organizationName: string = $state("");
  let websiteUrl: string = $state("");
  let selectedTag: string = $state("");

  const selectedTagTitle = $derived(
    tags.find((tag) => tag.value === selectedTag)?.title ?? "",
  );

  // ── Result (populated by backend once wired up) ────────────────────────────
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
    <ProcessingView
      {tags}
      {organizationName}
      {websiteUrl}
      {selectedTag}
      oncomplete={() => (currentView = View.Success)}
    />
  {:else if currentView === View.Success}
    <SuccessView {result} {organizationName} {selectedTagTitle} />
  {/if}
</div>
