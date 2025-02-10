<script lang="ts">
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import TogglePasswordIcon from "./TogglePasswordIcon.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { clickOutside } from "$components/actions/ClickOutside";
  import {
    trimInput,
    toLowerCase,
    replaceSpecialChars,
  } from "$components/actions/Input.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";
  import log from "$utils/log";
  import { type TenantTheme } from "$data/models/tenant.model";

  const t = useTranslations();

  interface Props {
    tenant?: any;
    openAIKey?: string;
    azureOpenAIKey?: string;
    azureSpeechKey?: string;
  }

  let {
    tenant = $bindable(),
    openAIKey = "",
    azureOpenAIKey = "",
    azureSpeechKey = "",
  }: Props = $props();

  let confirmUpdateModal: HTMLDialogElement | undefined = $state();
  let alertModal: HTMLDialogElement | undefined = $state();
  let alertMessage = $state("");

  const MODE = {
    Create: "create",
    Edit: "edit",
  };

  const TenantFeature = {
    TextPrommpts: "text-prommpts",
    AudioToText: "audio-to-text",
  };

  const ApiKeyProvider = {
    OpenAI: "openai",
    AzureOpenAI: "azure_openai",
    AzureOpenAIPro: "azure_openai_pro",
  };

  // mode
  let mode = tenant ? MODE.Edit : MODE.Create;
  let tenantData = $derived(tenant ?? {});

  $effect(() => {
    tenantData.name = tenantData.name ?? "";
    tenantData.org_name = tenantData.org_name ?? "";
    tenantData.default_language = tenantData.default_language ?? "";
    tenantData.theme = tenantData.theme ?? "";
    tenantData.azure_openai_instance_name =
      tenantData.azure_openai_instance_name ?? "";
    tenantData.azure_openai_endpoint = tenantData.azure_openai_endpoint ?? "";
    tenantData.azure_openai_whisper_model =
      tenantData.azure_openai_whisper_model ?? "";
    tenantData.azure_openai_chat_model =
      tenantData.azure_openai_chat_model ?? "";
    tenantData.speech_region = tenantData.speech_region ?? "";
    tenantData.is_restrict_user_managment =
      tenantData.is_restrict_user_managment ?? false;
  });

  $inspect(tenantData);

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
  let textSelectedProvider = $state(providerValues[0]);
  let isAudioToTextChecked = $state(false);
  // svelte-ignore state_referenced_locally
  if (tenantData && tenantData.included_features?.length) {
    const findTextProvider = tenantData.included_features.find(
      (item: any) => item.name == TenantFeature.TextPrommpts,
    );
    if (findTextProvider) {
      textSelectedProvider =
        providerValues.find(
          (item) => item.value == findTextProvider.provider,
        ) || providerValues[0];
    }

    isAudioToTextChecked = tenantData.included_features.some(
      (item: any) => item.name == TenantFeature.AudioToText,
    );
  }

  // color picker
  // svelte-ignore state_referenced_locally
  let hex = tenantData?.primary_color || "#491EFF";
  let selecteColor = $state(hex);
  let showPicker = $state(false);

  // set default values
  // svelte-ignore state_referenced_locally
  if (tenantData && !tenantData.default_language) {
    tenantData.default_language = "de";
  }
  // svelte-ignore state_referenced_locally
  if (tenantData && !tenantData.theme) {
    tenantData.theme = "dark" as TenantTheme;
  }
  // svelte-ignore state_referenced_locally
  if (tenantData && !tenantData.primary_color) {
    tenantData.primary_color = selecteColor;
  }

  function toggleColorPicker() {
    showPicker = !showPicker;
  }

  function togglePassword(_apiKeyProvider: string) {
    let passwordField = document.getElementById(
      "open_ai_key",
    ) as HTMLInputElement;
    if (_apiKeyProvider == ApiKeyProvider.AzureOpenAI) {
      passwordField = document.getElementById(
        "azure_open_ai_key",
      ) as HTMLInputElement;
    } else if (_apiKeyProvider == ApiKeyProvider.AzureOpenAIPro) {
      passwordField = document.getElementById(
        "azure_open_ai_key_pro",
      ) as HTMLInputElement;
    }
    if (passwordField.type === "password") {
      passwordField.type = "text";
    } else {
      passwordField.type = "password";
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

    if (textSelectedProvider.value == ApiKeyProvider.OpenAI && !openAIKey) {
      showAlert(t("tenant.validate-open-ai-key-message"));
      return false;
    }

    if (isAudioToTextChecked && !azureOpenAIKey) {
      showAlert(t("tenant.validate-azure-open-ai-key-message"));
      return false;
    }

    if (azureOpenAIKey) {
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

    return true;
  }

  async function createTenant() {
    if (validateForm()) {
      try {
        showLoading();
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: openAIKey,
            azure_openai_api_key: azureOpenAIKey,
            speech_api_key: azureSpeechKey,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        log.d(data, "CREATE - encryptApiKeys data");
        const { openai_api_key, azure_openai_api_key, speech_api_key } = data;

        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: textSelectedProvider.value,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            //provider: ApiKeyProvider.AzureOpenAI,
            provider: textSelectedProvider.value,
          });
        }
        log.d(tenantData, "CREATE - tenantData");

        const { error } = await actions.tenant.create(tenantData);
        hideLoading();
        if (error) {
          showAlert(error?.toString());
        } else {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });
          window.location.href = "/tenant-management";
        }
      } catch (error: any) {
        showAlert(error?.toString());
      }
    }
  }

  async function updateTenant() {
    if (validateForm()) {
      try {
        showLoading();
        const { error: encryptKeysError, data } =
          await actions.tenant.encryptApiKeys({
            openai_api_key: openAIKey,
            azure_openai_api_key: azureOpenAIKey,
            speech_api_key: azureSpeechKey,
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError?.toString());
          return;
        }
        log.d(data, "UPDATE - encryptApiKeys data");
        const { openai_api_key, azure_openai_api_key, speech_api_key } = data;

        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
        tenantData.speech_api_key = speech_api_key;

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: textSelectedProvider.value,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            //provider: ApiKeyProvider.AzureOpenAI,
            provider: textSelectedProvider.value,
          });
        }
        log.d(tenantData, "UPDATE - tenantData");

        const { error } = await actions.tenant.update(tenantData);
        hideLoading();

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

  function showAlert(message: string) {
    alertMessage = message;
    alertModal?.show();
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-10"
>
  <div class="flex items-center pt-5 pb-2">
    <button class="mr-4" onclick={() => window.history.back()}>
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {mode == MODE.Create
        ? t("tenant.tenants.add-tenant")
        : (tenantData.name ?? t("common.edit"))}
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
      <button class="btn" onclick={() => window.history.back()}>
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>
<div class="px-8 mb-10">
  <div class="container w-full mx-auto p-6">
    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
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
        <span class="mb-2 text-gray-400 font-medium text-sm"
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
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.language")}</span
        >
        <select
          class="select select-bordered w-full"
          bind:value={tenantData.default_language}
        >
          <option disabled>{t("tenant.language")}</option>
          <option value="de">{t("tenant.german-language")}</option>
          <option value="en">{t("tenant.english-language")}</option>
        </select>
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.theme")}</span
        >
        <select
          class="select select-bordered w-full"
          bind:value={tenantData.theme}
        >
          <option disabled>{t("tenant.theme")}</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="somedia">Somedia</option>
          <option value="weihnachtsmann">Weihnachtsmann</option>
          <option value="luxury">Luxury</option>
          <option value="lemonade">Lemonade</option>
        </select>
      </div>
    </div>

    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.primary-color")}</span
        >
        <div class="w-full">
          <div
            class="relative flex"
            use:clickOutside={() => {
              showPicker = false;
            }}
            onclickoutside={() => {
              showPicker = false;
            }}
          >
            <div class="z-[10]">
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="color-preview"
                style="background-color: {selecteColor};"
                onclick={toggleColorPicker}
              ></div>

              {#if showPicker}
                <div class="absolute picker-color">
                  <ColorPicker
                    {hex}
                    isDialog={false}
                    components={{
                      ...ChromeVariant,
                    }}
                    position="responsive"
                    label={""}
                    sliderDirection="horizontal"
                    textInputModes={["hex"]}
                    on:input={(event) => {
                      selecteColor = event.detail.hex;
                      tenantData.primary_color = selecteColor;
                    }}
                  />
                </div>
              {/if}
            </div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="flex flex-1 items-center input input-bordered color-input"
              onclick={toggleColorPicker}
            >
              <span>{selecteColor}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col mb-4"></div>
    </div>

    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20"></div>

    <div class="mb-3"><b>{t("tenant.api-keys")}</b></div>

    <div class="container mx-auto">
      <!-- Open AI Section -->
      <div class="collapse collapse-arrow bg-base-100 shadow rounded-lg mb-4">
        <input type="checkbox" />
        <div class="collapse-title">Open AI</div>
        <div class="collapse-content">
          <div class="flex flex-row space-x-4">
            <div class="flex-1 flex flex-col">
              <span class="mb-2 text-gray-400 font-medium text-sm"
                >{t("tenant.open-ai-provider")}</span
              >

              <label class="input input-bordered flex items-center gap-2 mt-2">
                <input
                  id="open_ai_key"
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={openAIKey}
                />
                <TogglePasswordIcon
                  change={() => togglePassword(ApiKeyProvider.OpenAI)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      <!-- Azure Section -->
      <div class="collapse collapse-arrow bg-base-100 shadow rounded-lg mb-4">
        <input type="checkbox" />
        <div class="collapse-title">Azure</div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 gap-4">
            <div class="w-full">
              <span class="mb-2 text-gray-400 font-medium text-sm"
                >{t("tenant.azure-open-ai-provider")}</span
              >

              <label class="input input-bordered flex items-center gap-2 mt-2">
                <input
                  id="azure_open_ai_key"
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={azureOpenAIKey}
                />
                <TogglePasswordIcon
                  on:change={() => togglePassword(ApiKeyProvider.AzureOpenAI)}
                />
              </label>
            </div>
            <div class="w-full">
              <span class="mb-2 text-gray-400 font-medium text-sm"
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
              <span class="mb-2 text-gray-400 font-medium text-sm"
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
              <span class="mb-2 text-gray-400 font-medium text-sm"
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
              <span class="mb-2 text-gray-400 font-medium text-sm"
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
          </div>
        </div>
      </div>

      <!-- Large File Azure Section -->
      <div class="collapse collapse-arrow bg-base-100 shadow rounded-lg">
        <input type="checkbox" />
        <div class="collapse-title">
          {t("tenant.settings.large-file-azure")}
        </div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 gap-4">
            <div class="w-full">
              <span class="mb-2 text-gray-400 font-medium text-sm"
                >{t("tenant.settings.large-file-azure-apiKey")}
              </span>

              <label class="input input-bordered flex items-center gap-2 mt-2">
                <input
                  id="azure_open_ai_key_pro"
                  type="password"
                  class="grow"
                  placeholder={t("tenant.api-key")}
                  bind:value={azureSpeechKey}
                />
                <TogglePasswordIcon
                  on:change={() =>
                    togglePassword(ApiKeyProvider.AzureOpenAIPro)}
                />
              </label>
            </div>
            <div class="w-full">
              <span class="mb-2 text-gray-400 font-medium text-sm"
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
    </div>

    <!-- Included features -->
    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20"></div>
    <div class="mb-3"><b>{t("tenant.included-featured")}</b></div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full bg-white rounded px-4 py-2">
      <div class="flex items-center">
        <input
          id="feature-text-prompt"
          type="checkbox"
          checked={true}
          class="checkbox checkbox-primary"
          value="text-prompt"
          disabled
        />
        <label class="label cursor-pointer ml-2" for="feature-text-prompt">
          <span class="label-text">{t("tenant.text-prompt")}</span>
        </label>
      </div>
      {#each providerValues as option}
        <div class="flex items-center mt-2 px-4">
          <input
            type="radio"
            id="radio-text-{option.value}"
            name="text-prompt-provider"
            class="radio radio-primary"
            value={option}
            checked={true}
            bind:group={textSelectedProvider}
          />
          <label
            for="radio-text-{option.value}"
            class="ml-2 font-medium text-sm">{option.label}</label
          >
        </div>
      {/each}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full bg-white rounded px-4 py-2 mt-4">
      <div class="flex items-center">
        <input
          id="feature-audio-to-text"
          type="checkbox"
          class="checkbox checkbox-primary"
          value="audio-to-text"
          bind:checked={isAudioToTextChecked}
        />
        <label class="label cursor-pointer ml-2" for="feature-audio-to-text">
          {@html svgIcons.audioToText}
          <span class="label-text ml-2">{t("tenant.audio-to-text")}</span>
        </label>
      </div>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full bg-white rounded px-4 py-2 mt-4">
      <div class="flex items-center">
        <input
          id="disable-create-user"
          type="checkbox"
          class="checkbox checkbox-primary"
          value="disbale-create-user"
          bind:checked={tenantData.is_restrict_user_managment}
        />
        <label class="label cursor-pointer ml-2" for="disable-create-user">
          <span class="label-text ml-2"
            >{t("tenant.restrict-user-managment")}</span
          >
        </label>
      </div>
    </div>

    <ConfirmDialog
      bind:modal={confirmUpdateModal}
      confirm={updateTenant}
      title={t("tenant.tenants.tenant.update-confirmation")}
    />

    <AlertDialog bind:modal={alertModal} bind:message={alertMessage} />
  </div>
</div>

<Loading bind:show={$loading} />

<style>
  .color-preview {
    width: 100px;
    height: 50px;
    display: inline-block;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
  .color-input {
    height: 50px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
  .picker-color {
    top: 54px;
    left: 0px;
  }
</style>
