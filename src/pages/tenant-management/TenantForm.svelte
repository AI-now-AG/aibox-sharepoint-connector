<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import TogglePasswordIcon from "./TogglePasswordIcon.svelte";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import AlertDialog from "$components/AlertDialog.svelte";
  import { clickOutside } from "$components/actions/ClickOutside.svelte";
  import {
    trimInput,
    toLowerCase,
    replaceSpecialChars,
  } from "$components/actions/Input.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";
  import log from "$utils/log";

  const t = useTranslations();

  export let tenant;
  export let openAIKey = "";
  export let azureOpenAIKey = "";

  let confirmUpdateModal;
  let alertModal;
  let alertMessage = "";

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
  };

  // mode
  let mode = tenant == undefined ? MODE.Create : MODE.Edit;
  let tenantData = tenant == undefined ? {} : tenant;

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
  let textSelectedProvider = providerValues[0];
  let isAudioToTextChecked = false;
  if (tenantData && tenantData?.included_features?.length) {
    const findTextProvider = tenantData.included_features.find(
      (item) => item.name == TenantFeature.TextPrommpts,
    );
    if (findTextProvider) {
      textSelectedProvider = providerValues.find(
        (item) => item.value == findTextProvider.provider,
      );
    }

    isAudioToTextChecked = tenantData.included_features.some(
      (item) => item.name == TenantFeature.AudioToText,
    );
  }

  // color picker
  let hex = tenantData?.primary_color || "#491EFF";
  let color = hex;
  let selecteColor = hex;

  // set default values
  if (!tenantData.default_language) {
    tenantData.default_language = "de";
  }
  if (!tenantData.theme) {
    tenantData.theme = "dark";
  }
  if (!tenantData.primary_color) {
    tenantData.primary_color = selecteColor;
  }

  $: {
    //console.log("Tenant data", tenantData);
    //console.log("Audio to text checbox checked", isAudioToTextChecked);
    //console.log("Selected text provider", textSelectedProvider);
  }

  let showPicker = false;

  function toggleColorPicker() {
    showPicker = !showPicker;
  }

  function togglePassword(_apiKeyProvider) {
    let passwordField = document.getElementById("open_ai_key");
    if (_apiKeyProvider == ApiKeyProvider.AzureOpenAI) {
      passwordField = document.getElementById("azure_open_ai_key");
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
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError);
          return;
        }
        log.d(data, "CREATE - encryptApiKeys data");
        const { openai_api_key, azure_openai_api_key } = data;

        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: textSelectedProvider.value,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: ApiKeyProvider.AzureOpenAI,
          });
        }
        log.d(tenantData, "CREATE - tenantData");

        const { error } = await actions.tenant.create(tenantData);
        hideLoading();
        if (error) {
          showAlert(error);
        } else {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });
          window.location.href = "/tenant-management";
        }
      } catch (error) {
        showAlert(error);
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
          });
        if (encryptKeysError) {
          showAlert(encryptKeysError);
          return;
        }
        log.d(data, "UPDATE - encryptApiKeys data");
        const { openai_api_key, azure_openai_api_key } = data;

        // API Keys
        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;

        // update providers
        tenantData.included_features = [];
        tenantData.included_features.push({
          name: TenantFeature.TextPrommpts,
          provider: textSelectedProvider.value,
        });
        if (isAudioToTextChecked) {
          tenantData.included_features.push({
            name: TenantFeature.AudioToText,
            provider: ApiKeyProvider.AzureOpenAI,
          });
        }
        log.d(tenantData, "UPDATE - tenantData");

        const { error } = await actions.tenant.update(tenantData);
        hideLoading();

        if (error) {
          showAlert(error);
        } else {
          addToast({
            message: t("tenant.update-successful"),
            type: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        showAlert(error);
      }
    }
  }

  function showAlert(message) {
    alertMessage = message;
    alertModal.show();
  }
</script>

<div
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14 sticky bg-base-200 top-0 z-10"
>
  <div class="flex items-center pt-5 pb-2">
    <button class="mr-4" onclick="window.history.back();">
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {mode == MODE.Create ? t("tenant.tenants.add-tenant") : tenantData.name}
    </h1>

    <div class="flex space-x-2 ml-auto">
      <button
        class="btn btn-primary"
        on:click={() => {
          mode == MODE.Edit ? confirmUpdateModal.show() : createTenant();
        }}
      >
        {t("common.save")}
      </button>
      <button class="btn" onclick="window.history.back();">
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
            use:clickOutside
            on:clickoutside={() => {
              showPicker = false;
            }}
          >
            <div>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="color-preview"
                style="background-color: {hex};"
                on:click={toggleColorPicker}
              />

              {#if showPicker}
                <div class="absolute picker-color">
                  <ColorPicker
                    bind:hex
                    bind:color
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
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="flex flex-1 items-center input input-bordered color-input"
              on:click={toggleColorPicker}
            >
              <span>{selecteColor}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col mb-4"></div>
    </div>

    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />

    <div class="mb-3"><b>{t("tenant.api-keys")}</b></div>

    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col">
        <div class="w-full">
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
              on:change={() => togglePassword(ApiKeyProvider.OpenAI)}
            />
          </label>
        </div>
      </div>

      <div class="flex-1 flex flex-col">
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

        <div class="w-full mt-4">
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

        <div class="w-full mt-4">
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

        <div class="w-full mt-4">
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

        <div class="w-full mt-4">
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

    <!-- Included features -->
    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />
    <div class="mb-3"><b>{t("tenant.included-featured")}</b></div>

    <!-- svelte-ignore a11y-no-static-element-interactions -->
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

    <!-- svelte-ignore a11y-no-static-element-interactions -->
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

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="w-full bg-white rounded px-4 py-2 mt-4">
      <div class="flex items-center">
        <input
          id="disable-create-user"
          type="checkbox"
          class="checkbox checkbox-primary"
          value="disbale-create-user"
          bind:checked={tenantData.disbale_create_new_user}
        />
        <label class="label cursor-pointer ml-2" for="disable-create-user">
          <span class="label-text ml-2"
            >{t("tenant.disable-create-new-user")}</span
          >
        </label>
      </div>
    </div>

    <ConfirmDialog
      title={t("tenant.tenants.tenant.update-confirmation")}
      bind:modal={confirmUpdateModal}
      on:confirm={updateTenant}
    />

    <AlertDialog bind:modal={alertModal} message={alertMessage} />
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
