<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { slide } from "svelte/transition";
  import Loading from "$components/Loading.svelte";
  import TogglePasswordIcon from "./TogglePasswordIcon.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import {
    trimInput,
    toLowerCase,
    toUpperCase,
    replaceSpecialChars,
  } from "$components/actions/Input.svelte";
  import InputDialog from "$components/InputDialog.svelte";
  import { isValidEmail } from "$utils/validation";
  import {
    TenantFeature,
    ApiKeyProvider,
    AudioCategory,
    Languges,
    Themes,
    LanguageCode,
    ThemeMap,
    ThemeCode,
  } from "$types/TenantFeature";
  import {
    SubscriptionPackageId,
    SubscriptionExtraPackage,
    SubscriptionIncludedUsers,
    AudioOptionId,
    BillingMethod,
    BillingMethodLabels,
  } from "$types/Subscription";
  import Dropdown from "$components/form/Dropdown.svelte";
  import AudioAddonsDropdown from "./AudioAddonsDropdown.svelte";
  import ThemeItem from "$components/tenant/ThemeItem.svelte";
  import { TextModel } from "$types/UsageTracking";
  import { SubscriptionPackages } from "$data/subscription-packages";
  import { onMount } from "svelte";
  import {
    ModelName,
    ReasoningEffortOption,
    EmbeddingProvider,
  } from "$types/AIProvider";
  import {
    EMBEDDING_MODELS,
    DEFAULT_VECTOR_KB_CONFIG,
    DEFAULT_RAG_ENHANCEMENT_CONFIG,
  } from "$types/VectorKB";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    tenant: any;
    subscription?: any;
    activeUsers?: number;
    isStripeInTestMode?: boolean;
    resellerCodes: string[];
    globalApiKeyStatus?: Record<string, boolean>;
  }

  let {
    tenant,
    subscription,
    activeUsers = 0,
    isStripeInTestMode = false,
    resellerCodes = [],
    globalApiKeyStatus = {},
  }: Props = $props();

  let addTenantAdminFor: "admin" | "sa" = $state("admin");
  let addTenantAdminModal: HTMLDialogElement | undefined = $state();
  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  const MODE = {
    Create: "create",
    Edit: "edit",
  };

  const resellerCodeOptions = resellerCodes.map((c) => ({
    title: c,
    value: c,
  }));

  // mode
  const mode = tenant ? MODE.Edit : MODE.Create;
  const headerTitle =
    mode == MODE.Create
      ? t("tenant.tenants.add-tenant")
      : tenant.name || t("common.edit");
  let tenantData = $state(tenant ?? {});
  tenantData.metadata = {
    openaiPrivateKeyEnabled: false,
    openaiGpt5PrivateKeyEnabled: false,
    azureOpenaiPrivateKeyEnabled: false,
    speechPrivateKeyEnabled: false,
    elevenLabsPrivateKeyEnabled: false,
    fluxPrivateKeyEnabled: false,
    perplexityPrivateKeyEnabled: false,
    claudePrivateKeyEnabled: false,
    geminiPrivateKeyEnabled: false,
    ...(tenant?.metadata ?? {}),
  };

  // subtitle_editor is deprecated - Subtitle Editor is now always active when Subtitle Studio is active
  // if (tenantData && tenantData.subtitle_editor === undefined) {
  //   tenantData.subtitle_editor = false;
  // }

  // Initialize new active flags with defaults
  if (tenantData && tenantData.audio_assistant_active === undefined) {
    tenantData.audio_assistant_active = true;
  }
  if (tenantData && tenantData.subtitle_studio_active === undefined) {
    tenantData.subtitle_studio_active = true;
  }

  // Initialize Vector KB defaults
  if (tenantData && tenantData.vector_kb_enabled === undefined) {
    tenantData.vector_kb_enabled = false;
  }
  if (tenantData && tenantData.vector_kb_chunk_size === undefined) {
    tenantData.vector_kb_chunk_size = DEFAULT_VECTOR_KB_CONFIG.chunkSize;
  }
  if (tenantData && tenantData.vector_kb_chunk_overlap === undefined) {
    tenantData.vector_kb_chunk_overlap = DEFAULT_VECTOR_KB_CONFIG.chunkOverlap;
  }
  if (tenantData && tenantData.vector_kb_max_storage_mb === undefined) {
    tenantData.vector_kb_max_storage_mb = DEFAULT_VECTOR_KB_CONFIG.maxStorageMB;
  }
  if (tenantData && tenantData.vector_kb_debug_enabled === undefined) {
    tenantData.vector_kb_debug_enabled = false;
  }
  if (tenantData && tenantData.vector_kb_chunking_strategy === undefined) {
    tenantData.vector_kb_chunking_strategy =
      DEFAULT_RAG_ENHANCEMENT_CONFIG.chunkingStrategy;
  }

  // Subscription & billing
  const subscriptionOptions = [
    {
      value: SubscriptionPackageId.Starter,
      title: "aibox Starter",
    },
    { value: SubscriptionPackageId.Teams, title: "aibox Teams" },
    { value: SubscriptionPackageId.Pro, title: "aibox Pro" },
    {
      value: SubscriptionExtraPackage.Enterprise,
      title: "aibox Enterprise",
    },
  ];
  let selectedPlan: SubscriptionPackageId | SubscriptionExtraPackage = $state(
    subscription?.plan_name ?? "",
  );
  const planAddOns = subscription?.add_ons ?? [];
  const initAudioToTextOptions =
    planAddOns.filter((option: any) => {
      return [
        AudioOptionId.AudioBasis,
        AudioOptionId.AudioBasisAddOnLarge,
        AudioOptionId.AudioToText,
      ].includes(option);
    }) || [];
  const initSubtitleStudioOptions =
    planAddOns.filter((option: any) => {
      return [
        AudioOptionId.AudioBasisAddOnSubtitle,
        AudioOptionId.AudioPremium,
      ].includes(option);
    }) || [];

  let selectedAudioToTextOptions: AudioOptionId[] = $state(
    initAudioToTextOptions,
  );
  let selectedSubtitleStudioOptions: AudioOptionId[] = $state(
    initSubtitleStudioOptions,
  );

  tenantData.billing_info = tenant?.billing_info ?? {};

  let subscriptionData = $state({
    is_trial: subscription?.is_trial ?? false,
    trial_start_date: subscription?.trial_start_date?.split("T")[0] ?? "",
    start_date: subscription?.start_date?.split("T")[0] ?? "",
    cancelled_date: subscription?.cancelled_date?.split("T")[0] ?? "",
  });

  // User Limits
  let totalUserLimit = $derived(
    (tenant?.included_user_limit || 0) + (tenant?.extra_user_limit || 0),
  );
  let userUsagePercent = $derived(
    totalUserLimit > 0
      ? Math.min(100, Math.round((activeUsers / totalUserLimit) * 100))
      : 0,
  );

  // Features enabled
  let openAIEnabled: boolean = $state(false);
  let openAIGpt5Enabled: boolean = $state(false);
  let azureOpenAIEnabled: boolean = $state(false);
  let perplexityEnabled: boolean = $state(false);
  let dalleEnabled: boolean = $state(false);
  let gptImageEnabled: boolean = $state(false);
  let nanoBananaImageEnabled: boolean = $state(false);
  let nanoBananaProImageEnabled: boolean = $state(false);
  let fluxEnabled: boolean = $state(false);
  let claudeEnabled: boolean = $state(false);
  let geminiEnabled: boolean = $state(false);

  // Vector KB state
  let vectorKbEnabled: boolean = $state(tenantData?.vector_kb_enabled ?? false);
  let selectedEmbeddingProvider: EmbeddingProvider = $state(
    tenantData?.vector_kb_embedding_provider ?? EmbeddingProvider.OpenAI,
  );
  let selectedEmbeddingModel: string = $state(
    tenantData?.vector_kb_embedding_model ?? "text-embedding-3-small",
  );

  // Compute available embedding providers based on configured API keys
  let availableEmbeddingProviders = $derived(() => {
    const providers: { value: EmbeddingProvider; label: string }[] = [];
    if (openAIEnabled || tenantData?.openai_api_key) {
      providers.push({ value: EmbeddingProvider.OpenAI, label: "OpenAI" });
    }
    if (azureOpenAIEnabled || tenantData?.azure_openai_api_key) {
      providers.push({
        value: EmbeddingProvider.AzureOpenAI,
        label: "Azure OpenAI",
      });
    }
    if (geminiEnabled || tenantData?.gemini_api_key) {
      providers.push({ value: EmbeddingProvider.Gemini, label: "Gemini" });
    }
    return providers;
  });

  // Compute available embedding models based on selected provider
  let availableEmbeddingModels = $derived(() => {
    return EMBEDDING_MODELS[selectedEmbeddingProvider] || [];
  });

  let azureOpenAIKeyProField: HTMLInputElement;
  let elevenLabsAIKeyField: HTMLInputElement;
  let falOpenAIKeyField: HTMLInputElement;
  let defaultTextFeature = $state("");

  // API providers
  const providerValues = [
    {
      label: t("tenant.open-ai-model"),
      value: ApiKeyProvider.OpenAI,
    },
    {
      label: t("tenant.azure-open-ai-model"),
      value: ApiKeyProvider.AzureOpenAI,
    },
  ];
  let audioSelectedProvider = $state(providerValues[0]);

  if (tenantData && tenantData.included_features?.length) {
    const findTextProvider = tenantData.included_features?.find(
      (item: any) => item.name == TenantFeature.AudioToText,
    );
    if (findTextProvider) {
      audioSelectedProvider =
        providerValues.find(
          (item) => item.value == findTextProvider.provider,
        ) || providerValues[0];
    }
  }

  let tenantAdminEmail = $state("");
  let tenantAdminEmailErrorMessage = $state("");

  // ==========================================
  // AUDIO ASSISTANT Arrays
  // ==========================================
  const audioStandardArray = $state([
    {
      title: t("tenant.audio-to-text"),
      type: AudioCategory.AudioToText,
      checked:
        tenantData?.transcription_types?.includes(AudioCategory.AudioToText) ||
        false,
    },
    // Deprecated: Subtitle (Allegro M) and SubtitleJson - commented for future restoration
    // {
    //   title: t("tenant.subtitles"),
    //   type: AudioCategory.Subtitle,
    //   checked:
    //     tenantData?.transcription_types?.includes(AudioCategory.Subtitle) ||
    //     false,
    // },
    // {
    //   title: t("tenant.subtitles-json"),
    //   type: AudioCategory.SubtitleJson,
    //   checked:
    //     tenantData?.transcription_types?.includes(AudioCategory.SubtitleJson) ||
    //     false,
    // },
  ]);
  let isAudioToTextChecked = $derived(
    audioStandardArray.some((item: any) => item.checked),
  );

  const audioStandardInfo = $derived(
    audioStandardArray
      .filter((e) => e.checked === true)
      .map((e) => e.title)
      .join(", "),
  );

  let audioProArray = $state([
    {
      title: t("tenant.audio-pro"),
      type: AudioCategory.AudioPro,
      checked:
        tenantData?.transcription_types?.includes(AudioCategory.AudioPro) ||
        false,
    },
    // Deprecated: SubtitleLarge (Adagio L) - commented for future restoration
    // {
    //   title: t("tenant.subtitle-large"),
    //   type: AudioCategory.SubtitleLarge,
    //   checked:
    //     tenantData?.transcription_types?.includes(
    //       AudioCategory.SubtitleLarge,
    //     ) || false,
    // },
  ]);
  let isAzureAudioProEnabled: boolean = $derived(
    audioProArray.some((item: any) => item.checked),
  );

  const audioProInfo = $derived(
    audioProArray
      .filter((e) => e.checked === true)
      .map((e) => e.title)
      .join(", "),
  );

  // ==========================================
  // SUBTITLE STUDIO Arrays
  // ==========================================
  // Deprecated: SubtitleJson - commented for future restoration
  // const subtitleStudioArray = $state([
  //   {
  //     title: t("tenant.subtitles-json"),
  //     type: AudioCategory.SubtitleJson,
  //     checked:
  //       tenantData?.transcription_types?.includes(AudioCategory.SubtitleJson) ||
  //       false,
  //   },
  // ]);
  // let isSubtitleStudioChecked = $derived(
  //   subtitleStudioArray.some((item: any) => item.checked),
  // );
  //
  // const subtitleStudioInfo = $derived(
  //   subtitleStudioArray
  //     .filter((e) => e.checked === true)
  //     .map((e) => e.title)
  //     .join(", "),
  // );

  const subtitleStudio11LabsArray = $state([
    {
      title: t("tenant.subtitle-elevenLabs"),
      type: AudioCategory.Subtitle11Labs,
      checked:
        tenantData?.transcription_types?.includes(
          AudioCategory.Subtitle11Labs,
        ) || false,
    },
  ]);
  let isSubtitleStudio11LabsChecked = $derived(
    subtitleStudio11LabsArray.some((item: any) => item.checked),
  );

  const subtitleStudio11LabsInfo = $derived(
    subtitleStudio11LabsArray
      .filter((e) => e.checked === true)
      .map((e) => e.title)
      .join(", "),
  );

  // Legacy arrays for backwards compatibility (keeping the old names)
  const audioElevenLabsArray = subtitleStudio11LabsArray;
  let isAudioToElevenLabsChecked = $derived(isSubtitleStudio11LabsChecked);
  const audioElevenLabsInfo = subtitleStudio11LabsInfo;

  // Check if any subtitle features are enabled (simplified - only 11Labs remains)
  const isAnySubtitleFeatureEnabled = $derived(
    // subtitleStudioArray.some((item) => item.checked) || // Deprecated: SubtitleJson
    subtitleStudio11LabsArray.some((item) => item.checked),
  );

  // Check if any Audio Assistant features are enabled
  const isAnyAudioAssistantFeatureEnabled = $derived(
    audioStandardArray.some((item) => item.checked) ||
      audioProArray.some((item) => item.checked),
  );

  // Auto-sync parent active toggles with sub-feature checkboxes
  $effect(() => {
    // Sync Audio Assistant active toggle with sub-features
    if (
      isAnyAudioAssistantFeatureEnabled &&
      !tenantData.audio_assistant_active
    ) {
      // If any feature is checked but toggle is off, enable it
      tenantData.audio_assistant_active = true;
    } else if (
      !isAnyAudioAssistantFeatureEnabled &&
      tenantData.audio_assistant_active
    ) {
      // If no features are checked but toggle is on, disable it
      tenantData.audio_assistant_active = false;
    }
  });

  $effect(() => {
    // Sync Subtitle Studio active toggle with sub-features
    if (isAnySubtitleFeatureEnabled && !tenantData.subtitle_studio_active) {
      // If any feature is checked but toggle is off, enable it
      tenantData.subtitle_studio_active = true;
    } else if (
      !isAnySubtitleFeatureEnabled &&
      tenantData.subtitle_studio_active
    ) {
      // If no features are checked but toggle is on, disable it
      tenantData.subtitle_studio_active = false;
    }
  });

  let selectedLanguage: string = $state(LanguageCode.De);
  let selectedThemes: { title: string; value: string } | undefined = $state(
    ThemeMap[ThemeCode.AIBox],
  );

  if (tenantData) {
    const { api_key_providers = [], included_features = [] } = tenantData;

    const findProvider = (provider: ApiKeyProvider) =>
      api_key_providers.some(
        (item: any) => item.name === provider && item.active,
      );

    openAIEnabled = findProvider(ApiKeyProvider.OpenAI);
    openAIGpt5Enabled = findProvider(ApiKeyProvider.OpenAIGpt5);
    azureOpenAIEnabled = findProvider(ApiKeyProvider.AzureOpenAI);
    perplexityEnabled = findProvider(ApiKeyProvider.Perplexity);
    claudeEnabled = findProvider(ApiKeyProvider.Claude);
    geminiEnabled = findProvider(ApiKeyProvider.Gemini);

    dalleEnabled = tenantData.included_features?.some(
      (item: any) =>
        item.name == TenantFeature.CreateImage &&
        item.provider == ApiKeyProvider.OpenAI,
    );

    gptImageEnabled = tenantData.included_features?.some(
      (item: any) =>
        item.name == TenantFeature.GptImage &&
        item.provider == ApiKeyProvider.OpenAI,
    );

    nanoBananaImageEnabled = tenantData.included_features?.some(
      (item: any) =>
        item.name == TenantFeature.CreateImage &&
        item.provider == ApiKeyProvider.Gemini,
    );

    nanoBananaProImageEnabled = tenantData.included_features?.some(
      (item: any) =>
        item.name == TenantFeature.CreateImage &&
        item.provider == ApiKeyProvider.GeminiPro,
    );

    fluxEnabled = tenantData.included_features?.some(
      (item: any) => item.provider == ApiKeyProvider.Flux,
    );

    defaultTextFeature =
      api_key_providers.find((item: any) => item.default)?.name ||
      included_features.find(
        (item: any) => item.name === TenantFeature.AudioToText,
      )?.provider;

    // svelte-ignore state_referenced_locally
    if (defaultTextFeature) {
      openAIEnabled ||= defaultTextFeature === ApiKeyProvider.OpenAI;
      openAIGpt5Enabled ||= defaultTextFeature === ApiKeyProvider.OpenAIGpt5;
      azureOpenAIEnabled ||= defaultTextFeature === ApiKeyProvider.AzureOpenAI;
    }
  }

  // set default values
  if (tenantData.default_language) {
    selectedLanguage = tenantData.default_language;
  }
  if (tenantData && !tenantData.theme) {
    tenantData.theme = ThemeCode.AIBox as ThemeCode;
    selectedThemes = Themes.find((item) => item.value === tenantData.theme);
  }
  if (tenantData.theme) {
    selectedThemes = Themes.find((item) => item.value === tenantData.theme);
  }
  if (tenantData && !tenantData.openai_chat_model) {
    tenantData.openai_chat_model = ModelName.Gpt4o;
  }
  if (tenantData && !tenantData.openai_gpt5_chat_model) {
    tenantData.openai_gpt5_chat_model = ModelName.Gpt5;
  }
  if (tenantData && !tenantData.openai_gpt5_reasoning_effort) {
    tenantData.openai_gpt5_reasoning_effort = ReasoningEffortOption.None;
  }

  if (tenantData && !tenantData.owned_by_reseller) {
    tenantData.owned_by_reseller = "";
  }

  function togglePassword(field: HTMLInputElement) {
    if (field) {
      field.type = field.type === "password" ? "text" : "password";
    }
  }

  let selectedPerplexityModel: string = $state(
    tenantData.perplexity_chat_model ?? "",
  );

  let selectedClaudeModel: string = $state(
    tenantData.anthropic_chat_model ?? "",
  );

  let selectedGeminiModel: string = $state(tenantData.gemini_chat_model ?? "");

  // ==========================================
  // TEXT PROVIDER TABLE CONFIG
  // ==========================================
  const TEXT_PROVIDERS = [
    {
      key: "openai",
      name: t("tenant.open-ai-provider"),
      provider: ApiKeyProvider.OpenAI,
      modelField: "openai_chat_model",
      apiKeyField: "openai_api_key",
      privateKeyFlag: "openaiPrivateKeyEnabled",
      globalKeyField: "openai_api_key",
      hasExtraConfig: false,
    },
    {
      key: "openai_gpt5",
      name: t("tenant.open-ai-provider") + " GPT-5",
      provider: ApiKeyProvider.OpenAIGpt5,
      modelField: "openai_gpt5_chat_model",
      apiKeyField: "openai_gpt5_api_key",
      privateKeyFlag: "openaiGpt5PrivateKeyEnabled",
      globalKeyField: "openai_gpt5_api_key",
      hasExtraConfig: false,
    },
    {
      key: "azure_openai",
      name: t("tenant.azure-open-ai-provider"),
      provider: ApiKeyProvider.AzureOpenAI,
      modelField: "azure_openai_chat_model",
      apiKeyField: "azure_openai_api_key",
      privateKeyFlag: "azureOpenaiPrivateKeyEnabled",
      globalKeyField: "azure_openai_api_key",
      hasExtraConfig: true,
    },
    {
      key: "perplexity",
      name: t("tenant.perplexity.name"),
      provider: ApiKeyProvider.Perplexity,
      modelField: "perplexity_chat_model",
      apiKeyField: "perplexity_api_key",
      privateKeyFlag: "perplexityPrivateKeyEnabled",
      globalKeyField: "perplexity_api_key",
      hasExtraConfig: false,
    },
    {
      key: "claude",
      name: t("tenant.claude.name"),
      provider: ApiKeyProvider.Claude,
      modelField: "anthropic_chat_model",
      apiKeyField: "anthropic_api_key",
      privateKeyFlag: "claudePrivateKeyEnabled",
      globalKeyField: "anthropic_api_key",
      hasExtraConfig: false,
    },
    {
      key: "gemini",
      name: t("tenant.gemini.name"),
      provider: ApiKeyProvider.Gemini,
      modelField: "gemini_chat_model",
      apiKeyField: "gemini_api_key",
      privateKeyFlag: "geminiPrivateKeyEnabled",
      globalKeyField: "gemini_api_key",
      hasExtraConfig: false,
    },
  ];

  function getProviderEnabled(key: string): boolean {
    switch (key) {
      case "openai":
        return openAIEnabled;
      case "openai_gpt5":
        return openAIGpt5Enabled;
      case "azure_openai":
        return azureOpenAIEnabled;
      case "perplexity":
        return perplexityEnabled;
      case "claude":
        return claudeEnabled;
      case "gemini":
        return geminiEnabled;
      default:
        return false;
    }
  }

  function setProviderEnabled(key: string, value: boolean) {
    switch (key) {
      case "openai":
        openAIEnabled = value;
        break;
      case "openai_gpt5":
        openAIGpt5Enabled = value;
        break;
      case "azure_openai":
        azureOpenAIEnabled = value;
        break;
      case "perplexity":
        perplexityEnabled = value;
        break;
      case "claude":
        claudeEnabled = value;
        break;
      case "gemini":
        geminiEnabled = value;
        break;
    }
  }

  function getProviderModel(key: string): string {
    switch (key) {
      case "openai":
        return tenantData.openai_chat_model || "";
      case "openai_gpt5":
        return tenantData.openai_gpt5_chat_model || "";
      case "azure_openai":
        return tenantData.azure_openai_chat_model || "";
      case "perplexity":
        return selectedPerplexityModel || "";
      case "claude":
        return selectedClaudeModel || "";
      case "gemini":
        return selectedGeminiModel || "";
      default:
        return "";
    }
  }

  let azureConfigExpanded = $state(false);

  const keyFieldRefs: Record<string, HTMLInputElement> = {};
  function trackKeyField(node: HTMLInputElement, key: string) {
    keyFieldRefs[key] = node;
    return {
      destroy() {
        delete keyFieldRefs[key];
      },
    };
  }

  function toggleTextFeature(feature: ApiKeyProvider) {
    defaultTextFeature = defaultTextFeature === feature ? "" : feature;

    !openAIEnabled &&
      (openAIEnabled = defaultTextFeature === ApiKeyProvider.OpenAI);
    !openAIGpt5Enabled &&
      (openAIGpt5Enabled = defaultTextFeature === ApiKeyProvider.OpenAIGpt5);
    !azureOpenAIEnabled &&
      (azureOpenAIEnabled = defaultTextFeature === ApiKeyProvider.AzureOpenAI);
    !perplexityEnabled &&
      (perplexityEnabled = defaultTextFeature === ApiKeyProvider.Perplexity);
    !claudeEnabled &&
      (claudeEnabled = defaultTextFeature === ApiKeyProvider.Claude);
    !geminiEnabled &&
      (geminiEnabled = defaultTextFeature === ApiKeyProvider.Gemini);

    if (feature === ApiKeyProvider.OpenAI) {
      updateTextFeature(feature, openAIEnabled);
    } else if (feature === ApiKeyProvider.OpenAIGpt5) {
      updateTextFeature(feature, openAIGpt5Enabled);
    } else if (feature === ApiKeyProvider.AzureOpenAI) {
      updateTextFeature(feature, azureOpenAIEnabled);
    } else if (feature === ApiKeyProvider.Perplexity) {
      updateTextFeature(feature, perplexityEnabled);
    } else if (feature === ApiKeyProvider.Claude) {
      updateTextFeature(feature, claudeEnabled);
    } else if (feature === ApiKeyProvider.Gemini) {
      updateTextFeature(feature, geminiEnabled);
    }
  }

  /**
   * Check if a provider has a valid API key available:
   * either the tenant has a private key, or a global key is configured.
   */
  function hasApiKey(apiKeyField: string, privateKeyFlag?: string): boolean {
    // Tenant has their own key
    if (tenantData[apiKeyField]) return true;
    // Using global key — check if it's configured
    if (privateKeyFlag && tenantData.metadata?.[privateKeyFlag]) return false; // private key enabled but no key
    return !!globalApiKeyStatus?.[apiKeyField];
  }

  function validateForm() {
    if (!tenantData?.name) {
      showAlert(t("tenant.validate-empty-display-name-message"));
      return false;
    }

    if (!tenantData?.org_name) {
      showAlert(t("tenant.validate-empty-identification-name-message"));
      return false;
    }

    if (!defaultTextFeature) {
      showAlert(t("tenant.validate-default-should-be-select"));
      return false;
    }

    if (
      defaultTextFeature == ApiKeyProvider.OpenAI &&
      !hasApiKey("openai_api_key", "openaiPrivateKeyEnabled")
    ) {
      showAlert(t("tenant.validate-open-ai-key-message"));
      return false;
    }

    if (
      defaultTextFeature == ApiKeyProvider.OpenAIGpt5 &&
      !hasApiKey("openai_gpt5_api_key", "openaiGpt5PrivateKeyEnabled")
    ) {
      showAlert("[GPT-5] " + t("tenant.validate-open-ai-key-message"));
      return false;
    }

    const atLeastTextSelected =
      openAIEnabled ||
      openAIGpt5Enabled ||
      azureOpenAIEnabled ||
      perplexityEnabled ||
      claudeEnabled ||
      geminiEnabled;
    if (!atLeastTextSelected) {
      showAlert(t("tenant.validate-atleast-one-select"));
      return false;
    }

    if (
      isAudioToTextChecked &&
      !hasApiKey("azure_openai_api_key", "azureOpenaiPrivateKeyEnabled")
    ) {
      showAlert(t("tenant.validate-azure-open-ai-key-message"));
      return false;
    }

    if (
      tenantData.azure_openai_api_key ||
      (azureOpenAIEnabled &&
        hasApiKey("azure_openai_api_key", "azureOpenaiPrivateKeyEnabled"))
    ) {
      // Only require config fields on the tenant when private key is enabled.
      // Otherwise, global config is used (checked via globalApiKeyStatus).
      if (
        !tenantData?.azure_openai_instance_name &&
        !globalApiKeyStatus?.azure_openai_instance_name
      ) {
        showAlert(
          t("tenant.validate-azure-open-ai-instance-name-empty-message"),
        );
        return false;
      }
      if (
        !tenantData?.azure_openai_endpoint &&
        !globalApiKeyStatus?.azure_openai_endpoint
      ) {
        showAlert(t("tenant.validate-azure-open-ai-endpoint-empty-message"));
        return false;
      }
      if (
        !tenantData?.azure_openai_whisper_model &&
        !globalApiKeyStatus?.azure_openai_whisper_model
      ) {
        showAlert(
          t("tenant.validate-azure-open-ai-transciption-model-empty-message"),
        );
        return false;
      }
      if (
        !tenantData?.azure_openai_chat_model &&
        !globalApiKeyStatus?.azure_openai_chat_model
      ) {
        showAlert(t("tenant.validate-azure-open-ai-text-model-empty-message"));
        return false;
      }
    }

    if (isAudioToTextChecked) {
      if (
        audioSelectedProvider.value === ApiKeyProvider.OpenAI &&
        !hasApiKey("openai_api_key", "openaiPrivateKeyEnabled")
      ) {
        showAlert(t("tenant.validate-open-ai-key-message"));
        return false;
      }

      if (
        audioSelectedProvider.value === ApiKeyProvider.OpenAIGpt5 &&
        !hasApiKey("openai_gpt5_api_key", "openaiGpt5PrivateKeyEnabled")
      ) {
        showAlert("[GPT-5] " + t("tenant.validate-open-ai-key-message"));
        return false;
      }
    }

    if (
      isAzureAudioProEnabled &&
      !hasApiKey("speech_api_key", "speechPrivateKeyEnabled")
    ) {
      showAlert(t("tenant.validate-azure-speech-service-key"));
      return false;
    }

    if (hasApiKey("speech_api_key", "speechPrivateKeyEnabled")) {
      if (!tenantData?.speech_region && !globalApiKeyStatus?.speech_region) {
        showAlert(t("tenant.validate-azure-speech-service-region"));
        return false;
      }
    }

    if (
      isAudioToElevenLabsChecked &&
      !hasApiKey("elevenLabs_api_key", "elevenLabsPrivateKeyEnabled")
    ) {
      showAlert(t("tenant.validate-elevenLabs-key"));
      return false;
    }
    return true;
  }

  function updateTextFeature(provider: ApiKeyProvider, isActive: boolean) {
    if (!tenantData) return;

    if (!tenantData.api_key_providers) {
      tenantData.api_key_providers = [];
    }
    const index = tenantData.api_key_providers.findIndex(
      (item: any) => item.name === provider,
    );

    if (index !== -1) {
      tenantData.api_key_providers[index].active = isActive;
      tenantData.api_key_providers[index].default =
        defaultTextFeature === provider;
    } else {
      tenantData.api_key_providers.push({
        name: provider,
        active: isActive,
        default: defaultTextFeature === provider,
      });
    }
  }

  async function createTenant() {
    if (validateForm()) {
      try {
        loading = true;
        tenantData.default_language = selectedLanguage;
        tenantData.theme = selectedThemes?.value as ThemeCode;
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: tenantData.openai_api_key,
            openai_gpt5_api_key: tenantData.openai_gpt5_api_key,
            azure_openai_api_key: tenantData.azure_openai_api_key,
            perplexity_api_key: tenantData.perplexity_api_key,
            speech_api_key: tenantData.speech_api_key,
            elevenLabs_api_key: tenantData.elevenLabs_api_key,
            fal_ai_api_key: tenantData.fal_ai_api_key,
            anthropic_api_key: tenantData.anthropic_api_key,
            gemini_api_key: tenantData.gemini_api_key,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        const {
          openai_api_key,
          openai_gpt5_api_key,
          azure_openai_api_key,
          perplexity_api_key,
          speech_api_key,
          elevenLabs_api_key,
          fal_ai_api_key,
          anthropic_api_key,
          gemini_api_key,
        } = data;

        cleanupValues();
        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.openai_gpt5_api_key = openai_gpt5_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;
        tenantData.elevenLabs_api_key = elevenLabs_api_key;
        tenantData.perplexity_api_key = perplexity_api_key;
        tenantData.fal_ai_api_key = fal_ai_api_key;
        tenantData.anthropic_api_key = anthropic_api_key;
        tenantData.gemini_api_key = gemini_api_key;

        tenantData.perplexity_chat_model = selectedPerplexityModel;
        tenantData.anthropic_chat_model = selectedClaudeModel;
        tenantData.gemini_chat_model = selectedGeminiModel;

        // Vector KB settings
        tenantData.vector_kb_enabled = vectorKbEnabled;
        tenantData.vector_kb_embedding_provider = vectorKbEnabled
          ? selectedEmbeddingProvider
          : null;
        tenantData.vector_kb_embedding_model = vectorKbEnabled
          ? selectedEmbeddingModel
          : null;

        updateTextFeature(ApiKeyProvider.OpenAI, openAIEnabled);
        updateTextFeature(ApiKeyProvider.OpenAIGpt5, openAIGpt5Enabled);
        updateTextFeature(ApiKeyProvider.AzureOpenAI, azureOpenAIEnabled);
        updateTextFeature(ApiKeyProvider.Perplexity, perplexityEnabled);
        updateTextFeature(ApiKeyProvider.Claude, claudeEnabled);
        updateTextFeature(ApiKeyProvider.Gemini, geminiEnabled);

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrompts,
          provider: defaultTextFeature,
        });
        // Add AudioToText feature if ANY audio feature is enabled (standard, pro, or ElevenLabs)
        if (
          isAudioToTextChecked ||
          isAzureAudioProEnabled ||
          isAudioToElevenLabsChecked
        ) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: audioSelectedProvider.value,
          });
        }
        let allTranscriptionTypes: string[] = [];
        if (isAudioToTextChecked) {
          allTranscriptionTypes = [
            ...allTranscriptionTypes,
            ...audioStandardArray
              .filter((item) => item.checked)
              .map((item) => item.type),
          ];
        }
        if (isAzureAudioProEnabled) {
          allTranscriptionTypes = [
            ...allTranscriptionTypes,
            ...audioProArray
              .filter((item) => item.checked)
              .map((item) => item.type),
          ];
        }
        if (isAudioToElevenLabsChecked) {
          allTranscriptionTypes = [
            ...allTranscriptionTypes,
            ...audioElevenLabsArray
              .filter((item) => item.checked)
              .map((item) => item.type),
          ];
        }
        tenantData.transcription_types = allTranscriptionTypes;

        if (dalleEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.OpenAI,
          });
        }

        if (fluxEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.Flux,
          });
        }

        if (gptImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.GptImage,
            provider: ApiKeyProvider.OpenAI,
          });
        }

        if (nanoBananaImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.Gemini,
          });
        }

        if (nanoBananaProImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.GeminiPro,
          });
        }

        if (tenantAdminEmail && isValidEmail(tenantAdminEmail)) {
          tenantData.tenant_admin_email = tenantAdminEmail;
        }

        const createTanentResult = await actions.tenant.create({
          tenant: tenantData,
          subscription: {
            plan_name: selectedPlan,
            add_ons: [
              ...selectedAudioToTextOptions,
              ...selectedSubtitleStudioOptions,
            ],
          },
        });
        const { error, data: createdTenant } = createTanentResult;

        loading = false;
        if (error) {
          showAlert(error?.toString());
        } else {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });
          const { insertedId = "" } = createdTenant;
          window.location.href = "/tenant-management/" + insertedId;
        }
      } catch (error: any) {
        showAlert(error?.toString());
      }
    }
  }

  async function updateTenant() {
    if (validateForm()) {
      try {
        loading = true;
        tenantData.default_language = selectedLanguage;
        tenantData.theme = selectedThemes?.value as ThemeCode;
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: tenantData.openai_api_key,
            openai_gpt5_api_key: tenantData.openai_gpt5_api_key,
            azure_openai_api_key: tenantData.azure_openai_api_key,
            perplexity_api_key: tenantData.perplexity_api_key,
            speech_api_key: tenantData.speech_api_key,
            elevenLabs_api_key: tenantData.elevenLabs_api_key,
            fal_ai_api_key: tenantData.fal_ai_api_key,
            anthropic_api_key: tenantData.anthropic_api_key,
            gemini_api_key: tenantData.gemini_api_key,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        const {
          openai_api_key,
          openai_gpt5_api_key,
          azure_openai_api_key,
          perplexity_api_key,
          speech_api_key,
          elevenLabs_api_key,
          fal_ai_api_key,
          anthropic_api_key,
          gemini_api_key,
        } = data;

        cleanupValues();
        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.openai_gpt5_api_key = openai_gpt5_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;
        tenantData.elevenLabs_api_key = elevenLabs_api_key;
        tenantData.perplexity_api_key = perplexity_api_key;
        tenantData.fal_ai_api_key = fal_ai_api_key;
        tenantData.anthropic_api_key = anthropic_api_key;
        tenantData.gemini_api_key = gemini_api_key;

        tenantData.perplexity_chat_model = selectedPerplexityModel;
        tenantData.anthropic_chat_model = selectedClaudeModel;
        tenantData.gemini_chat_model = selectedGeminiModel;

        // Vector KB settings
        tenantData.vector_kb_enabled = vectorKbEnabled;
        tenantData.vector_kb_embedding_provider = vectorKbEnabled
          ? selectedEmbeddingProvider
          : null;
        tenantData.vector_kb_embedding_model = vectorKbEnabled
          ? selectedEmbeddingModel
          : null;

        updateTextFeature(ApiKeyProvider.OpenAI, openAIEnabled);
        updateTextFeature(ApiKeyProvider.OpenAIGpt5, openAIGpt5Enabled);
        updateTextFeature(ApiKeyProvider.AzureOpenAI, azureOpenAIEnabled);
        updateTextFeature(ApiKeyProvider.Perplexity, perplexityEnabled);
        updateTextFeature(ApiKeyProvider.Claude, claudeEnabled);
        updateTextFeature(ApiKeyProvider.Gemini, geminiEnabled);

        if (!tenantData.transcription_types) {
          tenantData.transcription_types = [];
        }
        let updatedTranscriptionTypes = [];
        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrompts,
          provider: defaultTextFeature,
        });
        // Add AudioToText feature if ANY audio feature is enabled (standard, pro, or ElevenLabs)
        if (
          isAudioToTextChecked ||
          isAzureAudioProEnabled ||
          isAudioToElevenLabsChecked
        ) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: audioSelectedProvider.value,
          });
        }
        // Collect transcription types from AUDIO ASSISTANT arrays
        updatedTranscriptionTypes = audioStandardArray
          .filter((item) => item.checked)
          .map((item) => item.type);
        updatedTranscriptionTypes = [
          ...updatedTranscriptionTypes,
          ...audioProArray
            .filter((item) => item.checked)
            .map((item) => item.type),
        ];
        // Collect transcription types from SUBTITLE STUDIO arrays
        // Deprecated: SubtitleJson - commented for future restoration
        // updatedTranscriptionTypes = [
        //   ...updatedTranscriptionTypes,
        //   ...subtitleStudioArray
        //     .filter((item) => item.checked)
        //     .map((item) => item.type),
        // ];
        updatedTranscriptionTypes = [
          ...updatedTranscriptionTypes,
          ...subtitleStudio11LabsArray
            .filter((item) => item.checked)
            .map((item) => item.type),
        ];
        tenantData.transcription_types = updatedTranscriptionTypes;

        if (dalleEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.OpenAI,
          });
        }

        if (fluxEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.Flux,
          });
        }

        if (gptImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.GptImage,
            provider: ApiKeyProvider.OpenAI,
          });
        }

        if (nanoBananaImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.Gemini,
          });
        }

        if (nanoBananaProImageEnabled) {
          tenantData.included_features.push({
            name: TenantFeature.CreateImage,
            provider: ApiKeyProvider.GeminiPro,
          });
        }

        if (tenantAdminEmail && isValidEmail(tenantAdminEmail)) {
          tenantData.tenant_admin_email = tenantAdminEmail;
        }

        const { error } = await actions.tenant.update({
          tenant: tenantData,
          subscription: {
            plan_name: selectedPlan,
            add_ons: [
              ...selectedAudioToTextOptions,
              ...selectedSubtitleStudioOptions,
            ],
            start_date: subscriptionData.start_date || null,
            cancelled_date: subscriptionData.cancelled_date || null,
            is_trial: subscriptionData.is_trial || false,
            trial_start_date: subscriptionData.trial_start_date || null,
          },
        });
        loading = false;

        if (error) {
          showAlert(error?.toString());
        } else {
          addToast({
            message: t("tenant.update-successful"),
            type: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error: any) {
        showAlert(error?.toString());
      }
    }
  }

  function cleanupValues() {
    if (!tenantData.azure_openai_endpoint) {
      delete tenantData.azure_openai_endpoint;
    }
    if (!tenantData.azure_openai_instance_name) {
      delete tenantData.azure_openai_instance_name;
    }
    if (!tenantData.azure_openai_whisper_model) {
      delete tenantData.azure_openai_whisper_model;
    }
    if (!tenantData.azure_openai_chat_model) {
      delete tenantData.azure_openai_chat_model;
    }
  }

  async function createTenantAdmin(role: "admin" | "sa" = "admin") {
    loading = true;
    const { data, error } = await actions.tenant.createAdminUser({
      _id: tenantData._id,
      email: tenantAdminEmail,
      role,
    });

    loading = false;
    tenantAdminEmail = "";

    if (error) {
      addToast({
        message: `${t("tenant.create-tenant-admin-failed")} - ${error.toString()}`,
        type: "error",
      });
      return;
    }

    addToast({
      message: t("tenant.create-tenant-admin-successful"),
      type: "success",
    });
  }

  function goToBillingPortal() {
    const domain = "https://dashboard.stripe.com";
    const url = isStripeInTestMode
      ? `${domain}/test/customers/${tenantData.stripe_customer_id}`
      : `${domain}/customers/${tenantData.stripe_customer_id}`;
    window.open(url, "_blank");
  }

  function showAlert(message: string) {
    alertMessage = message;
    alertModal?.showModal();
  }
  onMount(() => {
    const calculateTotalPrice = () => {
      let packagePrice = 0;
      let audioOptionsTotalPrice = 0;

      // Get package price
      if (selectedPlan) {
        let selectedPackage =
          SubscriptionPackages.plan[
            selectedPlan as keyof typeof SubscriptionPackages.plan
          ];
        if (selectedPackage) {
          packagePrice = selectedPackage?.price || 0;
        }
      }

      // Get audio options price
      if (selectedAudioToTextOptions.length > 0) {
        selectedAudioToTextOptions.forEach((audioOptionId) => {
          let audioOption =
            SubscriptionPackages.audioOptions[
              audioOptionId as keyof typeof SubscriptionPackages.audioOptions
            ];
          if (audioOption) {
            audioOptionsTotalPrice += audioOption?.price || 0;
          }
        });
      }

      // Get audio options price
      if (selectedSubtitleStudioOptions.length > 0) {
        selectedSubtitleStudioOptions.forEach((audioOptionId) => {
          let audioOption =
            SubscriptionPackages.audioOptions[
              audioOptionId as keyof typeof SubscriptionPackages.audioOptions
            ];
          if (audioOption) {
            audioOptionsTotalPrice += audioOption?.price || 0;
          }
        });
      }

      return String(packagePrice + audioOptionsTotalPrice);
    };

    if (!tenant.totalPrice) {
      tenant.totalPrice = calculateTotalPrice();
    }
  });
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-40"
>
  <div class="flex items-center pt-5 pb-2">
    <button
      class="mr-4"
      onclick={() => (window.location.href = "/tenant-management")}
    >
      {@html svgIcons.back}
    </button>
    <h1 class="text-3xl font-bold">
      {headerTitle}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-outline"
        onclick={() => (window.location.href = "/tenant-management")}
      >
        {t("common.cancel")}
      </button>
      <button
        class="btn btn-primary"
        onclick={() => {
          mode == MODE.Edit ? confirmUpdateModal?.showModal() : createTenant();
        }}
      >
        {t("common.save")}
      </button>
    </div>
  </div>
</div>

<div class="px-8 mb-10">
  <div class="grid grid-cols-1 md:grid-cols-12 gap-10 p-6">
    <!-- MAIN CONTENT -->
    <div class="col-span-8 2xl:col-span-9">
      <!-- General settings -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-4 flex flex-row items-center gap-2">
          {@html svgIcons.tune}
          <p class="font-medium text-md">
            {t("tenant.detail.general-settings")}
          </p>
        </div>
        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.tenants.tenant.display-name")}*</span
            >
            <input
              type="text"
              placeholder={t("tenant.tenants.tenant.display-name")}
              class="input input-bordered w-full"
              bind:value={tenantData.name}
            />
          </div>

          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.tenants.tenant.name")}*</span
            >
            <input
              type="text"
              placeholder={t("tenant.tenants.tenant.identification-name")}
              class="input input-bordered w-full"
              use:trimInput
              use:toLowerCase
              use:replaceSpecialChars
              bind:value={tenantData.org_name}
            />
          </div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <Dropdown
              label={`${t("tenant.language")}*`}
              options={Languges}
              bind:value={selectedLanguage}
              labelClasses="font-medium text-sm"
            />
          </div>

          <div class="flex-1 flex flex-col mb-4">
            <ThemeItem
              title={`${t("tenant.theme")}*`}
              placeholder="e.g Light"
              items={Themes}
              bind:selectedItem={selectedThemes}
            />
          </div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.website-url")}</span
            >
            <input
              type="text"
              placeholder="e.g. ainow.ch"
              class="input input-bordered w-full"
              bind:value={tenantData.website}
            />
          </div>

          <div class="flex-1 flex flex-col mb-4"></div>
        </div>
      </div>

      <!-- Subscription & Billing -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center gap-2">
          {@html svgIcons.money}
          <p class="font-medium text-md">{t("tenant.subscription-billing")}</p>
        </div>
        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <Dropdown
              label={t("tenant.subscription")}
              options={subscriptionOptions}
              bind:value={selectedPlan}
              labelClasses="font-medium text-sm"
            />
          </div>
          <div class="flex-1 flex flex-col mb-4">
            <AudioAddonsDropdown
              title={t("tenant.audio-subscription")}
              placeholder=""
              bind:value={selectedAudioToTextOptions}
              type="audiototext"
            />
          </div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <AudioAddonsDropdown
              title={t("tenant.subtitle-subscription")}
              placeholder=""
              bind:value={selectedSubtitleStudioOptions}
              type="subtitlestudio"
            />
          </div>

          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.billing-method")}</span
            >
            <div class="join">
              <input
                type="text"
                class="input input-bordered bg-base-100 disabled:bg-base-100 disabled:border-gray-200 w-full join-item"
                disabled={true}
                value={tenantData.billing_method
                  ? BillingMethodLabels[
                      tenantData.billing_method as BillingMethod
                    ]
                  : ""}
              />
              {#if tenantData.billing_method === BillingMethod.CreditCard}
                <button
                  class="btn btn-neutral px-10 self-start font-medium join-item"
                  onclick={goToBillingPortal}
                >
                  {"Stripe"}
                </button>
              {/if}
            </div>
          </div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <p class="mb-2 font-medium text-sm">{t("tenant.total-price")}</p>
            <label class="input input-bordered w-full">
              {@html svgIcons.inputDollarIcon}
              <input
                type="number"
                class="font-medium"
                bind:value={tenantData.totalPrice}
              />
            </label>
          </div>
          <div class="flex-1 flex flex-col mb-4">&nbsp;</div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <p class="mb-2 font-medium text-sm">
              {t("tenant.subscription-start-date")}
            </p>
            <input
              type="date"
              bind:value={subscriptionData.start_date}
              class="input input-bordered w-full font-medium pr-10 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="flex-1 flex flex-col mb-4">
            <p class="mb-2 font-medium text-sm">
              {t("tenant.subscription-cancelled-date")}
            </p>

            <input
              type="date"
              bind:value={subscriptionData.cancelled_date}
              class="input input-bordered font-medium w-full"
            />
          </div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex justify-between flex-col lg:flex-row mb-4">
            <div class="flex items-center">
              <input
                id="sub-trial-phase"
                type="checkbox"
                class="toggle toggle-primary"
                bind:checked={subscriptionData.is_trial}
              />
              <label
                class="label cursor-pointer whitespace-normal"
                for="sub-trial-phase"
              >
                <span class="label-text text-base-content ml-2"
                  >{t("tenant.detail.sub-trial-phase")}</span
                >
              </label>
            </div>

            <div class="flex items-center">
              <p class="mr-2">{t("tenant.detail.sub-trial-start-date")}</p>
              <input
                type="date"
                bind:value={subscriptionData.trial_start_date}
                class="input input-bordered font-medium w-36"
              />
            </div>
          </div>
          <div class="flex-1 flex flex-col mb-4">&nbsp;</div>
        </div>
      </div>

      <!-- Contact & Address -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center gap-2">
          {@html svgIcons.home}
          <p class="font-medium text-md">
            {t("tenant.detail.contact-address")}
          </p>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.company-name")}</span
            >
            <input
              type="text"
              class="input input-bordered w-full"
              bind:value={tenantData.billing_info.company_name}
            />
          </div>
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.billing-email")}</span
            >
            <label class="input input-bordered w-full">
              {@html svgIcons.inputEmailIcon}
              <input
                type="text"
                class=""
                bind:value={tenantData.billing_info.email}
              />
            </label>
          </div>
        </div>
        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.street-number")}</span
            >
            <input
              type="text"
              class="input input-bordered w-full"
              bind:value={tenantData.billing_info.address}
            />
          </div>
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.zip-code")}</span
            >
            <input
              type="text"
              class="input input-bordered w-full"
              bind:value={tenantData.billing_info.zip_code}
            />
          </div>
        </div>
        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("subscription.location")}</span
            >
            <input
              type="text"
              class="input input-bordered w-full"
              bind:value={tenantData.billing_info.location}
            />
          </div>
          <div class="flex-1 flex flex-col mb-4">&nbsp;</div>
        </div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.comment")}</span
            >
            <textarea
              name="comment"
              id="comment"
              class="input input-bordered w-full py-2 text-gray-500 min-h-[60]"
              bind:value={tenantData.comment}
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Text Model Management -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-4 flex flex-row items-center gap-2">
          {@html svgIcons.textPrompt}
          <div>
            <p class="font-medium text-md">{t("tenant.text-model.title")}</p>
            <p class="text-sm text-base-content/60">
              {t("tenant.text-model.description")}
            </p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="bg-base-200/50">
                <th>{t("tenant.text-model.provider")}</th>
                <th class="text-center w-20">{t("common.activate")}</th>
                <th class="text-center w-20">{t("tenant.default")}</th>
                <th class="text-center w-28"
                  >{t("tenant.text-model.private-key")}</th
                >
                <th>{t("tenant.text-model.api-key-config")}</th>
              </tr>
            </thead>
            <tbody>
              {#each TEXT_PROVIDERS as p}
                <tr class="hover:bg-base-200/30">
                  <!-- Provider/Model -->
                  <td>
                    <div>
                      <span class="font-semibold text-base-content"
                        >{p.name}</span
                      >
                      <div class="text-xs text-base-content/50">
                        {getProviderModel(p.key)}
                      </div>
                    </div>
                  </td>
                  <!-- Active Toggle -->
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary toggle-sm"
                      checked={getProviderEnabled(p.key)}
                      disabled={defaultTextFeature === p.provider}
                      onchange={(e) => {
                        const checked = e.currentTarget.checked;
                        setProviderEnabled(p.key, checked);
                        updateTextFeature(p.provider, checked);
                      }}
                    />
                  </td>
                  <!-- Default Radio -->
                  <td class="text-center">
                    <input
                      type="radio"
                      name="defaultTextProvider"
                      class="radio radio-primary radio-sm"
                      checked={defaultTextFeature === p.provider}
                      onchange={() => toggleTextFeature(p.provider)}
                    />
                  </td>
                  <!-- Private Key -->
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary checkbox-sm"
                      checked={tenantData.metadata?.[p.privateKeyFlag] ?? false}
                      onchange={(e) => {
                        tenantData.metadata[p.privateKeyFlag] =
                          e.currentTarget.checked;
                      }}
                    />
                  </td>
                  <!-- API Key Configuration -->
                  <td>
                    {#if tenantData.metadata?.[p.privateKeyFlag]}
                      <label
                        class="input input-bordered input-sm flex items-center gap-2 w-full"
                      >
                        <input
                          use:trackKeyField={p.key}
                          type="password"
                          class="grow"
                          placeholder={t("tenant.api-key")}
                          value={tenantData[p.apiKeyField] ?? ""}
                          oninput={(e) => {
                            tenantData[p.apiKeyField] = e.currentTarget.value;
                          }}
                        />
                        <TogglePasswordIcon
                          change={() => togglePassword(keyFieldRefs[p.key])}
                        />
                      </label>
                    {:else}
                      <label
                        class="input input-bordered input-sm flex items-center gap-2 w-full opacity-60"
                      >
                        <input
                          type="text"
                          class="grow"
                          disabled
                          placeholder={globalApiKeyStatus?.[p.globalKeyField]
                            ? t("tenant.using-system-key")
                            : t("tenant.no-system-key")}
                        />
                        {#if globalApiKeyStatus?.[p.globalKeyField]}
                          <span class="badge bg-primary/15 text-primary border-primary/30 badge-xs"
                            >{t("global-api-keys.configured")}</span
                          >
                        {:else}
                          <span class="badge badge-warning badge-xs"
                            >{t("tenant.no-system-key")}</span
                          >
                        {/if}
                      </label>
                    {/if}
                  </td>
                </tr>
                <!-- Azure extra config row (expandable) -->
                {#if p.hasExtraConfig && getProviderEnabled("azure_openai")}
                  <tr class="bg-base-200/20">
                    <td colspan="5" class="py-1">
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs gap-1 text-base-content/70"
                        onclick={() => {
                          azureConfigExpanded = !azureConfigExpanded;
                        }}
                      >
                        <svg
                          class="w-3 h-3 transition-transform {azureConfigExpanded
                            ? 'rotate-90'
                            : ''}"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        Azure Configuration
                      </button>
                    </td>
                  </tr>
                  {#if azureConfigExpanded}
                    <tr class="bg-base-200/20">
                      <td colspan="5">
                        <div class="grid grid-cols-2 gap-4 px-4 py-2">
                          {#each [{ field: "azure_openai_instance_name", label: t("tenant.azure-open-ai-instance-name") }, { field: "azure_openai_endpoint", label: t("tenant.azure-open-ai-endpoint") }, { field: "azure_openai_whisper_model", label: t("tenant.azure-open-ai-transciption-model") }, { field: "azure_openai_chat_model", label: t("tenant.azure-open-ai-text-model") }] as acf}
                            <div class="w-full">
                              <span
                                class="text-sm font-medium text-base-content"
                                >{acf.label}</span
                              >
                              {#if tenantData.metadata?.azureOpenaiPrivateKeyEnabled}
                                <input
                                  type="text"
                                  class="input input-bordered input-sm mt-1 w-full"
                                  use:trimInput
                                  bind:value={tenantData[acf.field]}
                                />
                              {:else}
                                <label
                                  class="input input-bordered input-sm mt-1 w-full opacity-60 flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    class="grow"
                                    disabled
                                    placeholder={globalApiKeyStatus?.[acf.field]
                                      ? t("tenant.using-system-config")
                                      : t("tenant.no-system-config")}
                                  />
                                  {#if globalApiKeyStatus?.[acf.field]}
                                    <span class="badge bg-primary/15 text-primary border-primary/30 badge-xs"
                                      >{t("global-api-keys.configured")}</span
                                    >
                                  {:else}
                                    <span class="badge badge-warning badge-xs"
                                      >{t("tenant.no-system-config")}</span
                                    >
                                  {/if}
                                </label>
                              {/if}
                            </div>
                          {/each}
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- AUDIO ASSISTANT Section -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center justify-between">
          <div class="flex flex-row items-center gap-2">
            {@html svgIcons.audioToText}
            <p class="font-medium text-md">{t("nav.audiotool")}</p>
          </div>
          <!-- Active Toggle -->
          <label class="flex items-center gap-2">
            <span class="label-text">{t("tenant.tenants.tenant.active")}</span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={tenantData.audio_assistant_active}
            />
          </label>
        </div>
        <div class="container mx-auto">
          <!-- Audio Whisper Section -->
          <div
            class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
          >
            <input type="checkbox" />
            <div class="collapse-title flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="audio-whisper-model"
                  type="checkbox"
                  bind:checked={audioStandardArray[0].checked}
                  class="checkbox checkbox-primary z-10"
                />
                <!-- Original: disabled parent checkbox that reflected child state
            <input
              id="audio-whisper-model"
              type="checkbox"
              checked={isAudioToTextChecked}
              class="checkbox checkbox-primary z-10"
              disabled
            /> -->
                <label
                  class="label cursor-pointer ml-2"
                  for="audio-whisper-model"
                >
                  <span class="label-text text-base-content"
                    >{t("tenant.audio.whisper.model.title")}</span
                  >
                </label>
              </div>
              <div class="flex mb-2">
                <span class="text-base-content/50 font-medium text-sm"
                  >{audioStandardInfo}</span
                >
              </div>
            </div>

            <div class="collapse-content space-y-6">
              <div class="flex flex-col gap-4 mx-8">
                <!-- Simplified: Features section removed since only one feature exists
            <div class="rounded-lg">
              <span class="text-sm font-semibold">{t("tenant.features")}</span>
              <div class="flex flex-wrap gap-4 mt-2">
                {#each audioStandardArray as item, index}
                  <div class="flex items-center">
                    <input
                      id="audio-standard-{item.type}"
                      type="checkbox"
                      bind:checked={audioStandardArray[index].checked}
                      class="checkbox checkbox-primary checkbox-sm z-10"
                    />
                    <label
                      class="label cursor-pointer ml-2"
                      for="audio-standard-{item.type}"
                    >
                      <span class="label-text text-base-content"
                        >{item.title}</span
                      >
                    </label>
                  </div>
                {/each}
              </div>
            </div>
            -->

                <div class="alert">
                  <span class="text-sm"
                    >{t(
                      "tenant.whisper.model.configured.for.azure.openai",
                    )}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Large File Azure Section -->
          <div
            class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
          >
            <input type="checkbox" />
            <div class="collapse-title flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="audio-pro-model"
                  type="checkbox"
                  bind:checked={audioProArray[0].checked}
                  class="checkbox checkbox-primary z-10"
                />
                <!-- Original: disabled parent checkbox that reflected child state
            <input
              id="audio-pro-model"
              type="checkbox"
              checked={isAzureAudioProEnabled}
              class="checkbox checkbox-primary z-10"
              disabled
            /> -->
                <label class="label cursor-pointer ml-2" for="audio-pro-model">
                  <span class="label-text text-base-content"
                    >{t("tenant.settings.large-file-azure")}</span
                  >
                </label>
              </div>
              <div class="flex mb-2">
                <span class="text-base-content/50 font-medium text-sm"
                  >{audioProInfo}</span
                >
              </div>
            </div>
            <div class="collapse-content space-y-4">
              <!-- Simplified: Features section removed since only one feature exists
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="rounded-lg">
              <span class="text-sm font-semibold">{t("tenant.features")}</span>
              <div class="flex flex-wrap gap-4 mt-2">
                {#each audioProArray as item, index}
                  <div class="flex items-center">
                    <input
                      id="audio-pro-{item.type}"
                      type="checkbox"
                      bind:checked={audioProArray[index].checked}
                      class="checkbox checkbox-primary checkbox-sm z-10"
                    />
                    <label
                      class="label cursor-pointer ml-2"
                      for="audio-pro-{item.type}"
                    >
                      <span class="label-text text-base-content"
                        >{item.title}</span
                      >
                    </label>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          -->

              <div class="grid grid-cols-2 gap-4 mx-8">
                <div class="w-full">
                  <span class="mb-2 text-base-content font-medium text-sm"
                    >{t("tenant.settings.large-file-azure-apiKey")}
                  </span>

                  {#if tenantData.metadata?.speechPrivateKeyEnabled}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full"
                    >
                      <input
                        bind:this={azureOpenAIKeyProField}
                        type="password"
                        class="grow"
                        placeholder={t("tenant.api-key")}
                        bind:value={tenantData.speech_api_key}
                      />
                      <TogglePasswordIcon
                        change={() => togglePassword(azureOpenAIKeyProField)}
                      />
                    </label>
                  {:else}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full opacity-60"
                    >
                      <input
                        type="text"
                        class="grow"
                        disabled
                        placeholder={globalApiKeyStatus?.speech_api_key
                          ? t("tenant.using-system-key")
                          : t("tenant.no-system-key")}
                      />
                      {#if globalApiKeyStatus?.speech_api_key}
                        <span class="badge bg-primary/15 text-primary border-primary/30 badge-sm"
                          >{t("global-api-keys.configured")}</span
                        >
                      {:else}
                        <span class="badge badge-warning badge-sm"
                          >{t("tenant.no-system-key")}</span
                        >
                      {/if}
                    </label>
                  {/if}
                </div>
                <div class="w-full">
                  <span class="mb-2 text-base-content font-medium text-sm"
                    >{t("tenant.settings.large-file-azure-region")}</span
                  >
                  {#if tenantData.metadata?.speechPrivateKeyEnabled}
                    <input
                      type="text"
                      class="input input-bordered mt-2 w-full"
                      placeholder={""}
                      use:trimInput
                      bind:value={tenantData.speech_region}
                    />
                  {:else}
                    <label
                      class="input input-bordered mt-2 w-full opacity-60 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        class="grow"
                        disabled
                        placeholder={globalApiKeyStatus?.speech_region
                          ? t("tenant.using-system-config")
                          : t("tenant.no-system-config")}
                      />
                      {#if globalApiKeyStatus?.speech_region}
                        <span class="badge bg-primary/15 text-primary border-primary/30 badge-sm"
                          >{t("global-api-keys.configured")}</span
                        >
                      {:else}
                        <span class="badge badge-warning badge-sm"
                          >{t("tenant.no-system-config")}</span
                        >
                      {/if}
                    </label>
                  {/if}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mx-8">
                <label class="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary"
                    bind:checked={tenantData.metadata.speechPrivateKeyEnabled}
                  />
                  <span class="label-text"
                    >{t("tenant.settings.private-api-key")}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- Model Selection (for Audio Assistant) -->
          <!-- <div class="container mx-auto">
        <div class="bg-base-100 shadow-sm rounded-lg my-4">
          <div class="flex p-4 items-center justify-between">
            <div class="flex items-center justify-between">
              <label class="label cursor-pointer" for="">
                <span class="label-text text-base-content"
                  >{t("tenant.text.improvement.llm")}</span
                >
              </label>
            </div>
            <div class="flex gap-4">
              {#each providerValues as option}
                <div class="flex items-center">
                  <input
                    type="radio"
                    id="radio-text-{option.value}"
                    name="text-prompt-provider"
                    class="radio radio-sm radio-primary"
                    value={option}
                    bind:group={audioSelectedProvider}
                  />
                  <label
                    for="radio-text-{option.value}"
                    class="ml-2 font-medium text-sm">{option.label}</label
                  >
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div> -->
        </div>
      </div>

      <!-- SUBTITLE STUDIO Section -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center justify-between">
          <div class="flex flex-row items-center gap-2">
            {@html svgIcons.subtitle}
            <p class="font-medium text-md">{t("nav.subtitle-studio")}</p>
          </div>
          <!-- Active Toggle -->
          <label class="flex items-center gap-2">
            <span class="label-text">{t("tenant.tenants.tenant.active")}</span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={tenantData.subtitle_studio_active}
            />
          </label>
        </div>
        <div class="container mx-auto">
          <!-- Deprecated: SubtitleJson Section - commented for future restoration -->
          <!-- <div
        class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
      >
        <input type="checkbox" />
        <div class="collapse-title flex items-center justify-between gap-4">
          <div class="flex items-center">
            <input
              id="subtitle-json-model"
              type="checkbox"
              checked={isSubtitleStudioChecked}
              class="checkbox checkbox-primary z-10"
              disabled
            />
            <label class="label cursor-pointer ml-2" for="subtitle-json-model">
              <span class="label-text text-base-content"
                >{t("tenant.subtitles-json")}</span
              >
            </label>
          </div>
          <div class="flex mb-2">
            <span class="text-base-content/50 font-medium text-sm"
              >{subtitleStudioInfo}</span
            >
          </div>
        </div>

        <div class="collapse-content space-y-6">
          <div class="flex flex-col gap-4 mx-8">
            <div class="rounded-lg">
              <span class="text-sm font-semibold">{t("tenant.features")}</span>
              <div class="flex flex-wrap gap-4 mt-2">
                {#each subtitleStudioArray as item, index}
                  <div class="flex items-center">
                    <input
                      id="subtitle-studio-{item.type}"
                      type="checkbox"
                      bind:checked={subtitleStudioArray[index].checked}
                      class="checkbox checkbox-primary checkbox-sm z-10"
                    />
                    <label
                      class="label cursor-pointer ml-2"
                      for="subtitle-studio-{item.type}"
                    >
                      <span class="label-text text-base-content"
                        >{item.title}</span
                      >
                    </label>
                  </div>
                {/each}
              </div>
            </div>

            <div class="alert">
              <span class="text-sm"
                >{t("tenant.whisper.model.configured.for.azure.openai")}</span
              >
            </div>
          </div>
        </div>
      </div> -->

          <!-- 11Labs Subtitle Section -->
          <div
            class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
          >
            <input type="checkbox" />
            <div class="collapse-title flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="audio-elevenLabs-model"
                  type="checkbox"
                  bind:checked={audioElevenLabsArray[0].checked}
                  class="checkbox checkbox-primary z-10"
                />
                <!-- Original: disabled parent checkbox that reflected child state
            <input
              id="audio-elevenLabs-model"
              type="checkbox"
              checked={isAudioToElevenLabsChecked}
              class="checkbox checkbox-primary z-10"
              disabled
            /> -->
                <label
                  class="label cursor-pointer ml-2"
                  for="audio-elevenLabs-model"
                >
                  <span class="label-text text-base-content"
                    >{t("tenant.subtitle-elevenLabs.title")}</span
                  >
                </label>
              </div>
              <div class="flex mb-2">
                <span class="text-base-content/50 font-medium text-sm"
                  >{audioElevenLabsInfo}</span
                >
              </div>
            </div>
            <div class="collapse-content space-y-4">
              <!-- Simplified: Features section removed since only one feature exists
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="rounded-lg">
              <span class="text-sm font-semibold">{t("tenant.features")}</span>
              <div class="flex flex-wrap gap-4 mt-2">
                {#each audioElevenLabsArray as item, index}
                  <div class="flex items-center">
                    <input
                      id="audio-elevenLabs-{item.type}"
                      type="checkbox"
                      bind:checked={audioElevenLabsArray[index].checked}
                      class="checkbox checkbox-primary checkbox-sm z-10"
                    />
                    <label
                      class="label cursor-pointer ml-2"
                      for="audio-elevenLabs-{item.type}"
                    >
                      <span class="label-text text-base-content"
                        >{item.title}</span
                      >
                    </label>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          -->

              <div class="grid grid-cols-1 gap-4 mx-8">
                <div class="w-full">
                  <span class="mb-2 text-base-content font-medium text-sm"
                    >{t("tenant.settings.large-file-azure-apiKey")}
                  </span>

                  {#if tenantData.metadata?.elevenLabsPrivateKeyEnabled}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full"
                    >
                      <input
                        bind:this={elevenLabsAIKeyField}
                        type="password"
                        class="grow"
                        placeholder={t("tenant.api-key")}
                        bind:value={tenantData.elevenLabs_api_key}
                      />
                      <TogglePasswordIcon
                        change={() => togglePassword(elevenLabsAIKeyField)}
                      />
                    </label>
                  {:else}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full opacity-60"
                    >
                      <input
                        type="text"
                        class="grow"
                        disabled
                        placeholder={globalApiKeyStatus?.elevenLabs_api_key
                          ? t("tenant.using-system-key")
                          : t("tenant.no-system-key")}
                      />
                      {#if globalApiKeyStatus?.elevenLabs_api_key}
                        <span class="badge bg-primary/15 text-primary border-primary/30 badge-sm"
                          >{t("global-api-keys.configured")}</span
                        >
                      {:else}
                        <span class="badge badge-warning badge-sm"
                          >{t("tenant.no-system-key")}</span
                        >
                      {/if}
                    </label>
                  {/if}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mx-8">
                <label class="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary"
                    bind:checked={
                      tenantData.metadata.elevenLabsPrivateKeyEnabled
                    }
                  />
                  <span class="label-text"
                    >{t("tenant.settings.private-api-key")}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- Note: Subtitle Editor is now always available when Subtitle Studio is active -->
          <!-- The subtitle_editor checkbox has been removed - controlled by subtitle_studio_active flag -->
        </div>
      </div>

      <!-- Image creation -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center gap-2">
          {@html svgIcons.image}
          <p class="font-medium text-md">{t("tenant.image-creation")}</p>
        </div>

        <div class="container mx-auto">
          <!-- DALL-E (Open AI) Section -->
          <div class="p-4 bg-base-100 shadow-sm rounded-lg mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="image-dalle-model"
                  type="checkbox"
                  bind:checked={dalleEnabled}
                  class="checkbox checkbox-primary z-10"
                />
                <label
                  class="label cursor-pointer ml-2"
                  for="image-dalle-model"
                >
                  <span class="label-text text-base-content"
                    >{t("tenant.image-creation.dalle")}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- Flux -->
          <div
            class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
          >
            <input type="checkbox" />
            <div class="collapse-title flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="image-flux-model"
                  type="checkbox"
                  bind:checked={fluxEnabled}
                  class="checkbox checkbox-primary z-10"
                />
                <label class="label cursor-pointer ml-2" for="image-flux-model">
                  <span class="label-text text-base-content"
                    >{t("tenant.image-creation.flux")}</span
                  >
                </label>
              </div>
            </div>

            <div class="collapse-content space-y-6">
              <div class="grid grid-cols-2 gap-4 mx-8">
                <div class="w-full">
                  <span class="mb-2 text-base-content/50 font-medium text-sm"
                    >{t("tenant.image-creation.flux.api-key")}</span
                  >
                  {#if tenantData.metadata?.fluxPrivateKeyEnabled}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full"
                    >
                      <input
                        bind:this={falOpenAIKeyField}
                        type="password"
                        class="grow"
                        placeholder={t("tenant.api-key")}
                        bind:value={tenantData.fal_ai_api_key}
                      />
                      <TogglePasswordIcon
                        change={() => togglePassword(falOpenAIKeyField)}
                      />
                    </label>
                  {:else}
                    <label
                      class="input input-bordered flex items-center gap-2 mt-2 w-full opacity-60"
                    >
                      <input
                        type="text"
                        class="grow"
                        disabled
                        placeholder={globalApiKeyStatus?.fal_ai_api_key
                          ? t("tenant.using-system-key")
                          : t("tenant.no-system-key")}
                      />
                      {#if globalApiKeyStatus?.fal_ai_api_key}
                        <span class="badge bg-primary/15 text-primary border-primary/30 badge-sm"
                          >{t("global-api-keys.configured")}</span
                        >
                      {:else}
                        <span class="badge badge-warning badge-sm"
                          >{t("tenant.no-system-key")}</span
                        >
                      {/if}
                    </label>
                  {/if}
                </div>
                <div class="w-full">
                  <label class="flex flex-row items-center gap-2 mt-10">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary"
                      bind:checked={tenantData.metadata.fluxPrivateKeyEnabled}
                    />
                    <span class="label-text"
                      >{t("tenant.settings.private-api-key")}</span
                    >
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- GPT Image Section -->
          <div class="p-4 bg-base-100 shadow-sm rounded-lg mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="gpt-image-model"
                  type="checkbox"
                  bind:checked={gptImageEnabled}
                  class="checkbox checkbox-primary z-10"
                />
                <label class="label cursor-pointer ml-2" for="gpt-image-model">
                  <span class="label-text text-base-content"
                    >{t("tenant.image-creation.gpt")}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- Gemini Nano Banana Image Section -->
          <div class="p-4 bg-base-100 shadow-sm rounded-lg mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="nano-banana-image-model"
                  type="checkbox"
                  bind:checked={nanoBananaImageEnabled}
                  class="checkbox checkbox-primary z-10"
                />
                <label
                  class="label cursor-pointer ml-2"
                  for="nano-banana-image-model"
                >
                  <span class="label-text text-base-content"
                    >{t("tenant.image-creation.nano-banana")}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- Gemini Nano Banana Pro Image Section -->
          <div class="p-4 bg-base-100 shadow-sm rounded-lg mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center">
                <input
                  id="nano-banana-pro-image-model"
                  type="checkbox"
                  bind:checked={nanoBananaProImageEnabled}
                  class="checkbox checkbox-primary z-10"
                />
                <label
                  class="label cursor-pointer ml-2"
                  for="nano-banana-pro-image-model"
                >
                  <span class="label-text text-base-content"
                    >{t("tenant.image-creation.nano-banana-pro")}</span
                  >
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vector Knowledge Base Section -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <div class="mb-3 flex flex-row items-center justify-between">
          <div class="flex flex-row items-center gap-2">
            {@html svgIcons.document}
            <p class="font-medium text-md">{t("tenant.vector-kb.title")}</p>
          </div>
          <!-- Active Toggle -->
          <label class="flex items-center gap-2">
            <span class="label-text">{t("tenant.vector-kb.enable")}</span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={vectorKbEnabled}
            />
          </label>
        </div>

        {#if vectorKbEnabled}
          <div class="container mx-auto" transition:slide>
            <!-- Section 1: Embedding Configuration -->
            <div
              class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
            >
              <input type="checkbox" checked />
              <div class="collapse-title">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <span class="label-text text-base-content font-medium">
                      {t("tenant.vector-kb.embedding-config")}
                    </span>
                  </div>
                </div>
              </div>
              <div class="collapse-content">
                <div class="grid grid-cols-2 gap-4 mx-4 mb-4">
                  <!-- Embedding Provider -->
                  <div class="w-full">
                    <span class="mb-2 text-base-content font-medium text-sm">
                      {t("tenant.vector-kb.embedding-provider")}*
                    </span>
                    <select
                      class="select select-bordered w-full mt-1"
                      bind:value={selectedEmbeddingProvider}
                      onchange={() => {
                        // Reset model when provider changes
                        const models =
                          EMBEDDING_MODELS[selectedEmbeddingProvider];
                        if (models && models.length > 0) {
                          selectedEmbeddingModel = models[0].value;
                        }
                      }}
                    >
                      {#each availableEmbeddingProviders() as provider}
                        <option value={provider.value}>{provider.label}</option>
                      {/each}
                    </select>
                    {#if availableEmbeddingProviders().length === 0}
                      <p class="text-sm text-warning mt-1">
                        {t("tenant.vector-kb.embedding-provider-warning")}
                      </p>
                    {/if}
                  </div>

                  <!-- Embedding Model -->
                  <div class="w-full">
                    <span class="mb-2 text-base-content font-medium text-sm">
                      {t("tenant.vector-kb.embedding-model")}*
                    </span>
                    <select
                      class="select select-bordered w-full mt-1"
                      bind:value={selectedEmbeddingModel}
                    >
                      {#each availableEmbeddingModels() as model}
                        <option value={model.value}>{model.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Indexing Settings -->
            <div
              class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
            >
              <input type="checkbox" checked />
              <div class="collapse-title">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="label-text text-base-content font-medium">
                      {t("tenant.vector-kb.indexing-settings")}
                    </span>
                    <span class="badge badge-xs badge-ghost"
                      >{t("tenant.vector-kb.indexing-settings-hint")}</span
                    >
                  </div>
                </div>
              </div>
              <div class="collapse-content">
                <!-- Chunking Strategy -->
                <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <span class="text-base-content font-medium text-sm">
                        {t("tenant.vector-kb.chunking-strategy-title")}
                      </span>
                      <p class="text-xs text-base-content/60">
                        {t("tenant.vector-kb.chunking-strategy-description")}
                      </p>
                    </div>
                  </div>
                  <div class="w-full max-w-xs">
                    <select
                      class="select select-bordered select-sm w-full"
                      bind:value={tenantData.vector_kb_chunking_strategy}
                    >
                      <option value="fixed"
                        >{t("tenant.vector-kb.chunking-fixed")}</option
                      >
                      <option value="paragraph"
                        >{t("tenant.vector-kb.chunking-paragraph")}</option
                      >
                      <option value="heading"
                        >{t("tenant.vector-kb.chunking-heading")}</option
                      >
                      <option value="semantic"
                        >{t("tenant.vector-kb.chunking-semantic")}</option
                      >
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mx-4 mb-4">
                  <!-- Chunk Size -->
                  <div class="w-full">
                    <span class="mb-2 text-base-content font-medium text-sm">
                      {t("tenant.vector-kb.chunk-size")}
                    </span>
                    <input
                      type="number"
                      class="input input-bordered w-full mt-1"
                      bind:value={tenantData.vector_kb_chunk_size}
                      min="100"
                      max="2000"
                    />
                    <p class="text-xs text-base-content/60 mt-1">
                      {t("tenant.vector-kb.chunk-size-help")}
                    </p>
                  </div>

                  <!-- Chunk Overlap -->
                  <div class="w-full">
                    <span class="mb-2 text-base-content font-medium text-sm">
                      {t("tenant.vector-kb.chunk-overlap")}
                    </span>
                    <input
                      type="number"
                      class="input input-bordered w-full mt-1"
                      bind:value={tenantData.vector_kb_chunk_overlap}
                      min="0"
                      max="500"
                    />
                    <p class="text-xs text-base-content/60 mt-1">
                      {t("tenant.vector-kb.chunk-overlap-help")}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mx-4 mb-4">
                  <!-- Max Storage -->
                  <div class="w-full">
                    <span class="mb-2 text-base-content font-medium text-sm">
                      {t("tenant.vector-kb.max-storage")}
                    </span>
                    <input
                      type="number"
                      class="input input-bordered w-full mt-1"
                      bind:value={tenantData.vector_kb_max_storage_mb}
                      min="50"
                      max="10000"
                    />
                    <p class="text-xs text-base-content/60 mt-1">
                      {t("tenant.vector-kb.max-storage-help")}
                    </p>
                  </div>
                  <div class="w-full"></div>
                </div>
              </div>
            </div>

            <!-- Section 3: Debug Settings -->
            <div
              class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
            >
              <input type="checkbox" checked />
              <div class="collapse-title">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <span class="label-text text-base-content font-medium">
                      {t("tenant.vector-kb.debug-settings")}
                    </span>
                  </div>
                </div>
              </div>
              <div class="collapse-content">
                <!-- Debug Panel -->
                <div class="bg-base-200/50 rounded-lg p-4 mx-4 mb-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-base-content font-medium text-sm">
                        {t("tenant.vector-kb.debug-title")}
                      </span>
                      <p class="text-xs text-base-content/60">
                        {t("tenant.vector-kb.debug-description")}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      class="toggle toggle-primary toggle-sm"
                      bind:checked={tenantData.vector_kb_debug_enabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="alert alert-info mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                {t("tenant.vector-kb.info")}
              </span>
            </div>
          </div>
        {:else}
          <div class="container mx-auto">
            <div class="alert mb-4">
              <span class="text-sm text-base-content/60">
                {t("tenant.vector-kb.enable-hint")}
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="col-span-4 2xl:col-span-3">
      <!-- User Management -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <h5 class="mb-4 font-medium">
          {t("tenant.detail.user-management")}
        </h5>
        <div class="flex flex-col gap-2 mb-8">
          <button
            class={"mb-3 btn btn-outline font-normal grow-0 w-auto " +
              `${mode == MODE.Edit ? "" : "btn-disabled"}`}
            onclick={() => {
              addTenantAdminFor = "admin";
              addTenantAdminModal?.show();
            }}
          >
            {@html svgIcons.add}
            {t("tenant.add-tenant-admin")}
          </button>

          <button
            class={"btn btn-secondary font-normal grow-0 w-auto " +
              `${mode == MODE.Edit ? "" : "btn-disabled"}`}
            onclick={() => {
              addTenantAdminFor = "sa";
              addTenantAdminModal?.show();
            }}
          >
            {@html svgIcons.add}
            {t("tenant.add-tenant-supper-admin")}
          </button>
        </div>

        <div class="flex items-center p-3 bg-base-300/40 rounded-md">
          <input
            id="disable-create-user"
            type="checkbox"
            class="toggle toggle-primary"
            value="disable-create-user"
            bind:checked={tenantData.is_restrict_user_managment}
          />
          <label
            class="label cursor-pointer ml-2 whitespace-normal"
            for="disable-create-user"
          >
            <span class="label-text text-base-content text-sm"
              >{t("tenant.restrict-user-managment")}</span
            >
          </label>
        </div>
      </div>

      <!-- Status & conditions -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <h5 class="mb-4 font-medium">
          {t("tenant.detail.status-conditions")}
        </h5>
        <div class="flex flex-col gap-2">
          <div class="flex items-center p-3 bg-base-300/40 rounded-md">
            <input
              id="is-internal"
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={tenantData.is_internal}
            />
            <label
              class="label cursor-pointer ml-2 whitespace-normal"
              for="is-internal"
            >
              <span class="label-text text-base-content text-sm"
                >{"Internal"}</span
              >
            </label>
          </div>
          <div class="flex items-center p-3 bg-base-300/40 rounded-md">
            <div class="mr-auto">
              <input
                id="is-reseller"
                type="checkbox"
                class="toggle toggle-primary"
                bind:checked={tenantData.is_reseller}
              />
              <label
                class="label cursor-pointer ml-2 whitespace-normal"
                for="is-reseller"
              >
                <span class="label-text text-base-content text-sm"
                  >{"Reseller"}</span
                >
              </label>
            </div>
            <input
              type="text"
              class="input input-bordered input-sm w-32 disabled:bg-base-100"
              placeholder={t("tenant.detail.input-reseller-code-placeholder")}
              maxlength="15"
              use:trimInput
              use:toUpperCase
              use:replaceSpecialChars
              bind:value={tenantData.reseller_code}
              disabled={!tenantData.is_reseller}
            />
          </div>
          <div class="flex items-center p-3 bg-base-300/40 rounded-md">
            <input
              id="is-on-posthog"
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={tenantData.is_on_posthog}
            />
            <label
              class="label cursor-pointer ml-2 whitespace-normal"
              for="is-on-posthog"
            >
              <span class="label-text text-base-content text-sm"
                >{t("tenant.posthog")}</span
              >
            </label>
          </div>
          <div class="flex-1 flex flex-col mt-4">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.detail.owned-reseller-code")}</span
            >
            <Dropdown
              placeholder={t("tenant.detail.select-reseller-code-placeholder")}
              options={resellerCodeOptions}
              allowClear={true}
              bind:value={tenantData.owned_by_reseller}
              disabled={tenantData.is_reseller}
              labelClasses="font-medium text-sm"
            />
          </div>
        </div>
      </div>

      <!-- User Limits -->
      <div class="p-5 mb-8 bg-base-100 rounded-lg">
        <h5 class="mb-4 font-medium">
          {t("tenant.detail.user-limits")}
        </h5>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.detail.included-user-limits")}</span
            >
            <input
              type="number"
              placeholder=""
              class="input input-bordered disabled:bg-base-300/40 disabled:border-gray-200 w-full"
              bind:value={tenantData.included_user_limit}
            />
          </div>
          <div class="flex-1 flex flex-col">
            <span class="mb-2 text-base-content font-medium text-sm"
              >{t("tenant.detail.extra-user-limits")}</span
            >
            <input
              type="number"
              class="input input-bordered disabled:bg-base-300/40 disabled:border-gray-200 w-full"
              bind:value={tenantData.extra_user_limit}
              disabled={!selectedPlan}
            />
          </div>
        </div>

        <div class="divider mt-3 mb-2"></div>

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col">
            <p class="text-xs text-medium">
              {t("tenant.detail.total-user-limits")}
            </p>
          </div>
          <div class="flex-1 flex flex-col">
            <p class="text-xs text-bold text-right">
              {totalUserLimit}
            </p>
          </div>
        </div>

        {#if totalUserLimit}
          <progress
            class="progress progress-primary w-full"
            value={userUsagePercent}
            max="100"
          ></progress>
        {/if}

        <div class="flex flex-row space-x-4">
          <div class="flex-1 flex flex-col mb-4">
            <p class="text-xs text-base-content/60">
              {t("subscription.number-of-active-user")}
              {activeUsers}
            </p>
          </div>
          <div class="flex-1 flex flex-col mb-4">
            {#if totalUserLimit}
              <p class="text-xs text-base-content/60 text-right">
                {t("tenant.detail.users-used-percentage", {
                  percentage: userUsagePercent,
                })}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<ConfirmDialog
  bind:modal={confirmUpdateModal}
  confirm={updateTenant}
  title={t("tenant.tenants.tenant.update-confirmation")}
/>
<InputDialog
  bind:modal={addTenantAdminModal}
  bind:value={tenantAdminEmail}
  bind:errorMessage={tenantAdminEmailErrorMessage}
  title={addTenantAdminFor == "admin"
    ? t("tenant.add-tenant-admin")
    : t("tenant.add-tenant-supper-admin")}
  label={t("login.email")}
  save={(value: string) => {
    if (!isValidEmail(value)) {
      tenantAdminEmailErrorMessage = t("tenant.email-invalid");
    } else {
      tenantAdminEmailErrorMessage = "";
      addTenantAdminModal?.close();
      createTenantAdmin(addTenantAdminFor);
    }
  }}
/>
<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
<Loading show={loading} />
