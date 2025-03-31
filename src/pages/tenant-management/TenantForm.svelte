<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import TogglePasswordIcon from "./TogglePasswordIcon.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import {
    trimInput,
    toLowerCase,
    replaceSpecialChars,
  } from "$components/actions/Input.svelte";
  import { type TenantTheme } from "$data/models/tenant.model";
  import InputDialog from "$components/InputDialog.svelte";
  import { isValidEmail } from "$utils/common";
  import {
    TenantFeature,
    ApiKeyProvider,
    AudioCategory,
  } from "$types/TenantFeature";
  import SelectionInput from "./SelectionInput.svelte";
  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import ThemeItem from "./ThemeItem.svelte";

  const t = useTranslations();
  let loading = $state(false);

  interface Props {
    tenant?: any;
    usageSettings?: any;
  }

  let { tenant, usageSettings }: Props = $props();
  $inspect(usageSettings);

  let addTenantAdminModal: HTMLDialogElement | undefined = $state();
  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  const MODE = {
    Create: "create",
    Edit: "edit",
  };

  // mode
  const mode = tenant ? MODE.Edit : MODE.Create;
  const headerTitle =
    mode == MODE.Create
      ? t("tenant.tenants.add-tenant")
      : tenant.name || t("common.edit");
  let tenantData = $state(tenant ?? {});

  let openAIEnabled: boolean = $state(false);
  let azureOpenAIEnabled: boolean = $state(false);
  let perplexityEnabled: boolean = $state(false);
  let dalleEnabled: boolean = $state(false);
  let fluxEnabled: boolean = $state(false);

  let openAIKeyField: HTMLInputElement;
  let azureOpenAIKeyField: HTMLInputElement;
  let perplexityKeyField: HTMLInputElement;
  let azureOpenAIKeyProField: HTMLInputElement;
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

    // isAudioToTextChecked = tenantData.included_features.some(
    //   (item: any) => item.name == TenantFeature.AudioToText,
    // );
  }

  let tenantAdminEmail = $state("");
  let tenantAdminEmailErrorMessage = $state("");

  const audioStandardArray = $state([
    {
      title: t("tenant.audio-to-text"),
      type: AudioCategory.AudioToText,
      checked:
        tenantData?.transcription_types?.includes(AudioCategory.AudioToText) ||
        false,
    },
    {
      title: t("tenant.subtitles"),
      type: AudioCategory.Subtitle,
      checked:
        tenantData?.transcription_types?.includes(AudioCategory.Subtitle) ||
        false,
    },
    {
      title: t("tenant.subtitles-json"),
      type: AudioCategory.SubtitleJson,
      checked:
        tenantData?.transcription_types?.includes(AudioCategory.SubtitleJson) ||
        false,
    },
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
    {
      title: t("tenant.subtitle-large"),
      type: AudioCategory.SubtitleLarge,
      checked:
        tenantData?.transcription_types?.includes(
          AudioCategory.SubtitleLarge,
        ) || false,
    },
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

  const languages = [
    { title: "Deutsch", value: "de" },
    { title: "English", value: "en" },
  ];
  let selectedLanguage: { title: string; value: string } | undefined = $state();

  const themes = [
    { title: "Light", value: "light" },
    { title: "Dark", value: "dark" },
    { title: "aibox", value: "aibox" },
    { title: "Somedia", value: "somedia" },
  ];

  let selectedThemes: { title: string; value: string } | undefined = $state();

  if (tenantData && tenantData.transcription_types?.length) {
    //   isAzureAudioProEnabled = tenantData.transcription_types.some(
    //     (item: any) =>
    //       item === AudioCategory.AudioPro || item === AudioCategory.SubtitleLarge,
    //   );
  }

  if (tenantData) {
    // const findTextProvider = tenantData.api_key_providers.find(
    //   (item: any) => item.name == ApiKeyProvider.OpenAI,
    // );
    // if (findTextProvider) {
    //   textSelectedProvider =
    //     providerValues.find(
    //       (item) => item.value == findTextProvider.provider,
    //     ) || providerValues[0];
    // }

    const { api_key_providers = [], included_features = [] } = tenantData;

    const findProvider = (provider: ApiKeyProvider) =>
      api_key_providers.some(
        (item: any) => item.name === provider && item.active,
      );

    openAIEnabled = findProvider(ApiKeyProvider.OpenAI);
    azureOpenAIEnabled = findProvider(ApiKeyProvider.AzureOpenAI);
    perplexityEnabled = findProvider(ApiKeyProvider.Perplexity);

    dalleEnabled = tenantData.included_features?.some(
      (item: any) =>
        item.name == TenantFeature.CreateImage &&
        item.provider == ApiKeyProvider.OpenAI,
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
      azureOpenAIEnabled ||= defaultTextFeature === ApiKeyProvider.AzureOpenAI;
    }
  }

  // set default values
  if (!tenantData.default_language) {
    // tenantData.default_language = "de";
    selectedLanguage = languages.find(
      (item) => item.value === tenantData.default_language,
    );
  }
  if (tenantData.default_language) {
    selectedLanguage = languages.find(
      (item) => item.value === tenantData.default_language,
    ) ?? { title: "Deutsch", value: "de" };
  }
  if (tenantData && !tenantData.theme) {
    tenantData.theme = "dark" as TenantTheme;
    selectedThemes = themes.find((item) => item.value === tenantData.theme);
  }
  if (tenantData.theme) {
    selectedThemes = themes.find((item) => item.value === tenantData.theme);
  }

  function togglePassword(field: HTMLInputElement) {
    if (field) {
      field.type = field.type === "password" ? "text" : "password";
    }
  }

  let selectedPerplexityModel: string = $state(
    tenantData.perplexity_chat_model,
  );
  const listOfPerplexityModel = ["sonar", "sonar-pro"];

  function toggleTextFeature(feature: ApiKeyProvider) {
    defaultTextFeature = defaultTextFeature === feature ? "" : feature;

    !openAIEnabled &&
      (openAIEnabled = defaultTextFeature === ApiKeyProvider.OpenAI);
    !azureOpenAIEnabled &&
      (azureOpenAIEnabled = defaultTextFeature === ApiKeyProvider.AzureOpenAI);
    !perplexityEnabled &&
      (perplexityEnabled = defaultTextFeature === ApiKeyProvider.Perplexity);

    if (feature === ApiKeyProvider.OpenAI) {
      updateTextFeature(feature, openAIEnabled);
    } else if (feature === ApiKeyProvider.AzureOpenAI) {
      updateTextFeature(feature, azureOpenAIEnabled);
    } else if (feature === ApiKeyProvider.Perplexity) {
      updateTextFeature(feature, perplexityEnabled);
    }
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
      !tenantData.openai_api_key
    ) {
      showAlert(t("tenant.validate-open-ai-key-message"));
      return false;
    }

    const atLeastTextSelected =
      openAIEnabled || azureOpenAIEnabled || perplexityEnabled;
    if (!atLeastTextSelected) {
      showAlert(t("tenant.validate-atleast-one-select"));
      return false;
    }

    if (isAudioToTextChecked && !tenantData.azure_openai_api_key) {
      showAlert(t("tenant.validate-azure-open-ai-key-message"));
      return false;
    }

    if (tenantData.azure_openai_api_key) {
      if (!tenantData?.azure_openai_instance_name) {
        showAlert(
          t("tenant.validate-azure-open-ai-instance-name-empty-message"),
        );
        return false;
      }
      if (!tenantData?.azure_openai_endpoint) {
        showAlert(t("tenant.validate-azure-open-ai-endpoint-empty-message"));
        return false;
      }
      if (!tenantData?.azure_openai_whisper_model) {
        showAlert(
          t("tenant.validate-azure-open-ai-transciption-model-empty-message"),
        );
        return false;
      }
      if (!tenantData?.azure_openai_chat_model) {
        showAlert(t("tenant.validate-azure-open-ai-text-model-empty-message"));
        return false;
      }
    }

    if (isAudioToTextChecked) {
      if (
        audioSelectedProvider.value === ApiKeyProvider.OpenAI &&
        !tenantData.openai_api_key
      ) {
        showAlert(t("tenant.validate-open-ai-key-message"));
        return false;
      }
    }

    if (isAzureAudioProEnabled && !tenantData.speech_api_key) {
      showAlert(t("tenant.validate-azure-speech-service-key"));
      return false;
    }

    if (tenantData.speech_api_key) {
      if (!tenantData?.speech_region) {
        showAlert(t("tenant.validate-azure-speech-service-region"));
        return false;
      }
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
        tenantData.default_language = selectedLanguage?.value;
        tenantData.theme = selectedThemes?.value as TenantTheme;
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: tenantData.openai_api_key,
            azure_openai_api_key: tenantData.azure_openai_api_key,
            perplexity_api_key: tenantData.perplexity_api_key,
            speech_api_key: tenantData.speech_api_key,
            fal_ai_api_key: tenantData.fal_ai_api_key,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        const {
          openai_api_key,
          azure_openai_api_key,
          perplexity_api_key,
          speech_api_key,
          fal_ai_api_key,
        } = data;

        cleanupValues();
        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;
        tenantData.perplexity_api_key = perplexity_api_key;
        tenantData.fal_ai_api_key = fal_ai_api_key;

        tenantData.perplexity_chat_model = selectedPerplexityModel;
        updateTextFeature(ApiKeyProvider.OpenAI, openAIEnabled);
        updateTextFeature(ApiKeyProvider.AzureOpenAI, azureOpenAIEnabled);
        updateTextFeature(ApiKeyProvider.Perplexity, perplexityEnabled);

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: defaultTextFeature,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: audioSelectedProvider.value,
          });
          tenantData.transcription_types = audioStandardArray
            .filter((item) => item.checked)
            .map((item) => item.type);
        }
        if (isAzureAudioProEnabled) {
          tenantData.transcription_types = audioProArray
            .filter((item) => item.checked)
            .map((item) => item.type);
        }

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

        if (tenantAdminEmail && isValidEmail(tenantAdminEmail)) {
          tenantData.tenant_admin_email = tenantAdminEmail;
        }

        const createTanentResult = await actions.tenant.create({
          tenant: tenantData,
          usageSettings,
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

  $inspect(selectedThemes);

  async function updateTenant() {
    if (validateForm()) {
      try {
        loading = true;
        tenantData.default_language = selectedLanguage?.value;
        tenantData.theme = selectedThemes?.value as TenantTheme;
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: tenantData.openai_api_key,
            azure_openai_api_key: tenantData.azure_openai_api_key,
            perplexity_api_key: tenantData.perplexity_api_key,
            speech_api_key: tenantData.speech_api_key,
            fal_ai_api_key: tenantData.fal_ai_api_key,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        const {
          openai_api_key,
          azure_openai_api_key,
          perplexity_api_key,
          speech_api_key,
          fal_ai_api_key,
        } = data;

        cleanupValues();
        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;
        tenantData.perplexity_api_key = perplexity_api_key;
        tenantData.fal_ai_api_key = fal_ai_api_key;

        tenantData.perplexity_chat_model = selectedPerplexityModel;
        updateTextFeature(ApiKeyProvider.OpenAI, openAIEnabled);
        updateTextFeature(ApiKeyProvider.AzureOpenAI, azureOpenAIEnabled);
        updateTextFeature(ApiKeyProvider.Perplexity, perplexityEnabled);

        if (!tenantData.transcription_types) {
          tenantData.transcription_types = [];
        }
        let updatedTranscriptionTypes = [];
        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: defaultTextFeature,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: audioSelectedProvider.value,
          });
        }
        updatedTranscriptionTypes = audioStandardArray
          .filter((item) => item.checked)
          .map((item) => item.type);
        updatedTranscriptionTypes = [
          ...updatedTranscriptionTypes,
          ...audioProArray
            .filter((item) => item.checked)
            .map((item) => item.type),
        ];
        if (isAzureAudioProEnabled) {
        }
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

        if (tenantAdminEmail && isValidEmail(tenantAdminEmail)) {
          tenantData.tenant_admin_email = tenantAdminEmail;
        }

        const { error } = await actions.tenant.update({
          tenant: tenantData,
          usageSettings,
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

  async function createTenantAdmin() {
    try {
      loading = true;
      const { error } = await actions.tenant.createAdminUser({
        _id: tenantData._id,
        org_id: tenantData.org_id,
        tenant_admin_email: tenantAdminEmail,
      });

      loading = false;
      if (error) {
        addToast({
          message:
            t("tenant.create-tenant-admin-failed") + " - " + error.toString(),
          type: "success",
        });
      } else {
        addToast({
          message: t("tenant.create-tenant-admin-successful"),
          type: "success",
        });
      }
    } catch (error: any) {
      addToast({
        message:
          t("tenant.create-tenant-admin-failed") + " - " + error.toString(),
        type: "success",
      });
    } finally {
      tenantAdminEmail = "";
    }
  }

  function showAlert(message: string) {
    alertMessage = message;
    alertModal?.show();
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-20"
>
  <div class="flex items-center pt-5 pb-2">
    <button
      class="mr-4"
      onclick={() => (window.location.href = "/tenant-management")}
    >
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {headerTitle}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-primary"
        onclick={() => {
          mode == MODE.Edit ? confirmUpdateModal?.show() : createTenant();
        }}
      >
        {t("common.save")}
      </button>
      <button
        class="btn btn-outline"
        onclick={() => (window.location.href = "/tenant-management")}
      >
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>
<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-base-content font-medium text-sm"
          >{t("tenant.tenants.tenant.display-name")}</span
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
          >{t("tenant.tenants.tenant.name")}</span
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
        <SingleInput
          title={`${t("tenant.language")}*`}
          placeholder={t("tenant.german-language")}
          items={languages}
          bind:selectedItem={selectedLanguage}
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <ThemeItem
          title={`${t("tenant.theme")}*`}
          placeholder="e.g Light"
          items={themes}
          bind:selectedItem={selectedThemes}
        />
      </div>
    </div>

    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <div class="flex justify-end">
          <button
            class={"mt-7 btn btn-outline font-normal grow-0 w-auto " +
              `${mode == MODE.Edit ? "" : "btn-disabled"}`}
            onclick={() => {
              addTenantAdminModal?.show();
            }}
          >
            {@html svgIcons.add}
            {t("tenant.add-tenant-admin")}
          </button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Features -->
    <div class="mb-3 flex flex-row items-center gap-2">
      {@html svgIcons.textPrompt}
      <p class="font-medium text-md">{t("tenant.text.prompt.features")}</p>
    </div>

    <div class="container mx-auto">
      <!-- Open AI Section -->
      <div
        class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
      >
        <input type="checkbox" />
        <div class="collapse-title">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="feature-text-prompt"
                type="checkbox"
                bind:checked={openAIEnabled}
                class="checkbox checkbox-primary z-10"
                value="text-prompt"
                disabled={defaultTextFeature === ApiKeyProvider.OpenAI}
              />
              <label
                class="label cursor-pointer ml-2"
                for="feature-text-prompt"
              >
                <span class="label-text text-base-content"
                  >{t("tenant.open-ai-provider")}</span
                >
              </label>
            </div>
            {#if defaultTextFeature === ApiKeyProvider.OpenAI}
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{t("tenant.default")}</span
              >
            {/if}
          </div>
        </div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.model.name")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                value="gpt-4o"
                disabled
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.api-key")}</span
              >

              <label
                class="input input-bordered flex items-center gap-2 mt-2 w-full"
              >
                <input
                  bind:this={openAIKeyField}
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={tenantData.openai_api_key}
                />
                <TogglePasswordIcon
                  change={() => togglePassword(openAIKeyField)}
                />
              </label>
            </div>
            <div>
              <label class="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultTextFeature === ApiKeyProvider.OpenAI}
                  class="checkbox checkbox-primary"
                  onchange={() => toggleTextFeature(ApiKeyProvider.OpenAI)}
                />
                <span class="label-text">{t("tenant.mark-as-default")}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <!-- Azure Section -->
      <div
        class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
      >
        <input type="checkbox" />
        <div class="collapse-title">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="feature-azure-section"
                type="checkbox"
                bind:checked={azureOpenAIEnabled}
                class="checkbox checkbox-primary z-10"
                value="text-prompt"
                disabled={defaultTextFeature === ApiKeyProvider.AzureOpenAI}
              />
              <label
                class="label cursor-pointer ml-2"
                for="feature-azure-section"
              >
                <span class="label-text text-base-content"
                  >{t("tenant.azure-open-ai-provider")}</span
                >
              </label>
            </div>
            {#if defaultTextFeature === ApiKeyProvider.AzureOpenAI}
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{t("tenant.default")}</span
              >
            {/if}
          </div>
        </div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.azure-open-ai-provider")}</span
              >

              <label
                class="input input-bordered flex items-center gap-2 mt-2 w-full"
              >
                <input
                  bind:this={azureOpenAIKeyField}
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={tenantData.azure_openai_api_key}
                />
                <TogglePasswordIcon
                  change={() => togglePassword(azureOpenAIKeyField)}
                />
              </label>
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.azure-open-ai-instance-name")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={tenantData.azure_openai_instance_name}
              />
            </div>

            <div class="w-full">
              <span class="mb-2 ttext-base-content font-medium text-sm"
                >{t("tenant.azure-open-ai-endpoint")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                bind:value={tenantData.azure_openai_endpoint}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.azure-open-ai-transciption-model")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={tenantData.azure_openai_whisper_model}
              />
            </div>

            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.azure-open-ai-text-model")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={tenantData.azure_openai_chat_model}
              />
            </div>
            <div></div>
            <div>
              <label class="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultTextFeature === ApiKeyProvider.AzureOpenAI}
                  class="checkbox checkbox-primary"
                  onchange={() => toggleTextFeature(ApiKeyProvider.AzureOpenAI)}
                />
                <span class="label-text">{t("tenant.mark-as-default")}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Perplexity Section -->
      <div
        class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
      >
        <input type="checkbox" />
        <div class="collapse-title">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="feature-perplexity-section"
                type="checkbox"
                bind:checked={perplexityEnabled}
                class="checkbox checkbox-primary z-10"
                value="text-prompt"
                disabled={defaultTextFeature === ApiKeyProvider.Perplexity}
              />
              <label
                class="label cursor-pointer ml-2"
                for="feature-perplexity-section"
              >
                <span class="label-text text-base-content"
                  >{t("tenant.perplexity.name")}</span
                >
              </label>
            </div>
            {#if defaultTextFeature === ApiKeyProvider.Perplexity}
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{t("tenant.default")}</span
              >
            {/if}
          </div>
        </div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="w-full z-20">
              <SelectionInput
                title={`${t("tenant.model.name")}*`}
                placeholder="e.g. sonar"
                items={listOfPerplexityModel}
                bind:selectedItem={selectedPerplexityModel}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.api-key")}</span
              >

              <label
                class="input input-bordered flex items-center gap-2 mt-1 w-full"
              >
                <input
                  bind:this={perplexityKeyField}
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={tenantData.perplexity_api_key}
                />
                <TogglePasswordIcon
                  change={() => togglePassword(perplexityKeyField)}
                />
              </label>
            </div>
            <div>
              <label class="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  checked={defaultTextFeature === ApiKeyProvider.Perplexity}
                  class="checkbox checkbox-primary"
                  onchange={() => toggleTextFeature(ApiKeyProvider.Perplexity)}
                />
                <span class="label-text">{t("tenant.mark-as-default")}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Audio tools -->
    <div class="mb-3 flex flex-row items-center gap-2">
      {@html svgIcons.audioToText}
      <p class="font-medium text-md">{t("nav.audiotool")}</p>
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
              checked={isAudioToTextChecked}
              class="checkbox checkbox-primary z-10"
              value="text-prompt"
              disabled
            />
            <label class="label cursor-pointer ml-2" for="audio-whisper-model">
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
            <!-- Checkboxes for Audio to Text & Subtitles -->
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

            <div class="alert">
              <span class="text-sm"
                >{t("tenant.whisper.model.configured.for.azure.openai")}</span
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
              checked={isAzureAudioProEnabled}
              class="checkbox checkbox-primary z-10"
              value="text-prompt"
              disabled
            />
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
          <div class="grid grid-cols-2 gap-4 mx-8">
            <!-- Checkboxes for Audio Pro & Subtitles Large -->
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

          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.settings.large-file-azure-apiKey")}
              </span>

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
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content font-medium text-sm"
                >{t("tenant.settings.large-file-azure-region")}</span
              >
              <input
                type="text"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={tenantData.speech_region}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Model Selection -->
      <div class="container mx-auto">
        <div class="bg-base-100 shadow-sm rounded-lg my-4">
          <div class="flex p-4 items-center justify-between">
            <div class="flex items-center justify-between">
              <label class="label cursor-pointer" for="">
                <span class="label-text text-base-content"
                  >{t("tenant.text.improvement.llm")}</span
                >
                <!-- <span class="text-sm font-semibold"
                >{t("tenant.text.improvement.llm")}</span
              > -->
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
      </div>
    </div>

    <div class="divider"></div>

    <!-- Image creation -->
    <div class="mb-3 flex flex-row items-center gap-2">
      {@html svgIcons.image}
      <p class="font-medium text-md">{t("nav.create-image")}</p>
    </div>

    <div class="container mx-auto">
      <!-- DALL-E (Open AI) Section -->
      <div
        class="collapse collapse-arrow bg-base-100 shadow-sm rounded-lg mb-4"
      >
        <input type="checkbox" />
        <div class="collapse-title flex items-center justify-between gap-4">
          <div class="flex items-center">
            <input
              id="image-dalle-model"
              type="checkbox"
              bind:checked={dalleEnabled}
              class="checkbox checkbox-primary z-10"
              value="text-prompt"
            />
            <label class="label cursor-pointer ml-2" for="image-dalle-model">
              <span class="label-text text-base-content"
                >{"DALL-E (Open AI)"}</span
              >
            </label>
          </div>
        </div>

        <div class="collapse-content space-y-6">
          <div class="grid grid-cols-3 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Images per month"}
              </span>

              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={usageSettings.imageDalle.limitRequests}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Images created this month"}</span
              >
              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                disabled={true}
                bind:value={usageSettings.imageDalle.usedRequests}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Add Images for this month"}</span
              >
              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={usageSettings.imageDalle.extraAmount}
              />
            </div>
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
              value="text-prompt"
            />
            <label class="label cursor-pointer ml-2" for="image-flux-model">
              <span class="label-text text-base-content">{"Flux"}</span>
            </label>
          </div>
        </div>

        <div class="collapse-content space-y-6">
          <div class="grid grid-cols-2 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"API Key"}</span
              >
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
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4 mx-8">
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Images per month"}
              </span>

              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={usageSettings.imageFlux.limitRequests}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Images created this month"}</span
              >
              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                disabled={true}
                bind:value={usageSettings.imageFlux.usedRequests}
              />
            </div>
            <div class="w-full">
              <span class="mb-2 text-base-content/50 font-medium text-sm"
                >{"Add Images for this month"}</span
              >
              <input
                type="number"
                class="input input-bordered mt-2 w-full"
                placeholder={""}
                use:trimInput
                bind:value={usageSettings.imageFlux.extraAmount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- User Managment -->
    <div class="mb-3 flex flex-row items-center gap-2">
      {@html svgIcons.userGroup}
      <p class="font-medium text-md">{t("user.user-management")}</p>
    </div>

    <div class="container mx-auto">
      <div class="bg-base-100 shadow-sm rounded-lg my-4">
        <div class="flex p-4 items-center justify-between">
          <div class="flex items-center">
            <input
              id="disable-create-user"
              type="checkbox"
              class="checkbox checkbox-primary"
              value="disable-create-user"
              bind:checked={tenantData.is_restrict_user_managment}
            />
            <label class="label cursor-pointer ml-2" for="disable-create-user">
              <span class="label-text text-base-content ml-2"
                >{t("tenant.restrict-user-managment")}</span
              >
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto">
      <div class="bg-base-100 shadow-sm rounded-lg my-4">
        <div class="flex p-4 items-center justify-between">
          <div class="flex items-center">
            <input
              id="is-trial-tenant"
              type="checkbox"
              class="checkbox checkbox-primary"
              value="is-trial-tenant"
              bind:checked={tenantData.is_trial}
            />
            <label class="label cursor-pointer ml-2" for="is-trial-tenant">
              <span class="label-text text-base-content ml-2"
                >{t("tenant.trial")}</span
              >
            </label>
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
  title={t("tenant.add-tenant-admin")}
  label={t("login.email")}
  save={(value: string) => {
    if (!isValidEmail(value)) {
      tenantAdminEmailErrorMessage = t("tenant.email-invalid");
    } else {
      tenantAdminEmailErrorMessage = "";
      addTenantAdminModal?.close();
      createTenantAdmin();
    }
  }}
/>
<AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
<Loading show={loading} />
