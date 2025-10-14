<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();

  interface Props {
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }
  let { title, description, ctaLabel, ctaUrl = "#" }: Props = $props();
</script>

<div class="flex flex-col">
  <div class="w-full">
    <div
      class="flex flex-col border-dashed border-2 border-base-content/40 rounded-lg items-center justify-center p-6 lg:max-w-none"
    >
      <div class="text-6xl text-base-content/40 mb-4">
        {@html svgIcons.empty}
      </div>

      <p class="font-semibold">
        {title ?? "NO Tiltle"}
      </p>
      <p class="text-sm text-base-content/80">
        {description ?? "NO Description"}
      </p>
      <div class="mt-8 flex justify-center">
        <a href={ctaUrl}>
          <button class="btn btn-primary">
            {@html svgIcons.add}
            {ctaLabel ?? "NO Action"}
          </button>
        </a>
      </div>
    </div>
  </div>
</div>
