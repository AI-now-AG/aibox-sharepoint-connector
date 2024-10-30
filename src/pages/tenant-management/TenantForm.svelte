<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import TogglePasswordIcon from "./TogglePasswordIcon.svelte";
  import ConfirmUpdateDialog from "./ConfirmUpdateDialog.svelte";
  import AlertDialog from "./AlertDialog.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";
  import log from "$utils/log";
  import { ApiKeyProvider, TenantFeature } from "$constants";

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
  const t = useTranslations();

  let mode = tenant == undefined ? MODE.Create : MODE.Edit;
  let tenantData = tenant == undefined ? {} : tenant;

  let hex = tenantData?.primary_color || "#491EFF";
  let color = hex;
  let selecteColor = hex;

  if (!tenantData.default_language) {
    tenantData.default_language = "de";
  }

  if (!tenantData.theme) {
    tenantData.theme = "dark";
  }

  if (!tenantData.primary_color) {
    tenantData.primary_color = selecteColor;
  }

  let showPicker = false;
  function toggleColorPicker() {
    showPicker = !showPicker;
  }

  function selectFeatureApiKeyProvider(feature, provider) {
    // TODO: Update API Key provider for  Feature
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

  function hasFeatureAudioToText() {
    return tenantData?.included_features?.indexOf("audio-to-text") != -1;
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

    if (!openAIKey) {
      showAlert(t("tenant.validate-open-ai-key-message"));
      return false;
    }

    if (hasFeatureAudioToText() && !azureOpenAIKey) {
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

        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
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

        tenantData.openai_api_key = openai_api_key;
        tenantData.azure_openai_api_key = azure_openai_api_key;
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
  class="container max-w-full mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] px-14"
>
  <div class="flex items-center pt-8">
    <button class="mr-4" onclick="window.history.back();">
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {mode == MODE.Create ? t("tenant.tenants.add-tenant") : tenantData.name}
    </h1>

    <div class="flex space-x-2 fixed right-14 top-14 pt-2">
      <button
        class="mt-2 lg:mt-8 btn btn-primary"
        on:click={() => {
          showPicker = false;
          mode == MODE.Edit ? confirmUpdateModal.show() : createTenant();
        }}
      >
        {t("common.save")}
      </button>
      <button class="mt-2 lg:mt-8 btn" onclick="window.history.back();">
        {t("common.cancel")}
      </button>
    </div>
  </div>
</div>
<div class="px-8">
  <div class="container w-full mx-auto p-6" style="font-family: Inter;">
    <div class="flex flex-row space-x-4">
      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.tenants.tenant.display-name")}</span
        >
        <input
          type="text"
          value={tenantData?.name || ""}
          placeholder={t("tenant.tenants.tenant.display-name")}
          class="input input-bordered w-full"
          on:change={(event) => {
            tenantData.name = event.target.value?.trim();
          }}
          on:focus={() => {
            showPicker = false;
          }}
        />
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.tenants.tenant.name")}</span
        >
        <input
          type="text"
          value={tenantData?.org_name || ""}
          placeholder={t("tenant.tenants.tenant.identification-name")}
          class="input input-bordered w-full"
          on:change={(event) => {
            tenantData.org_name = event.target.value?.trim();
          }}
          on:focus={() => {
            showPicker = false;
          }}
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
          on:change={(event) => {
            tenantData.default_language = event.target.value;
          }}
          on:focus={() => {
            showPicker = false;
          }}
        >
          <option disabled>{t("tenant.language")}</option>
          <option value="de" selected={tenantData?.default_language == "de"}
            >{t("tenant.german-language")}</option
          >
          <option value="en" selected={tenantData?.default_language == "en"}
            >{t("tenant.english-language")}</option
          >
        </select>
      </div>

      <div class="flex-1 flex flex-col mb-4">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.theme")}</span
        >
        <select
          class="select select-bordered w-full"
          on:change={(event) => {
            tenantData.theme = event.target.value;
          }}
          on:focus={() => {
            showPicker = false;
          }}
        >
          <option disabled>{t("tenant.theme")}</option>
          <option value="light" selected={tenantData?.theme == "light"}
            >Light</option
          >
          <option value="dark" selected={tenantData?.theme == "dark"}
            >Dark</option
          >
          <option value="somedia" selected={tenantData?.theme == "somedia"}
            >Somedia</option
          >
          <option value="luxury" selected={tenantData?.theme == "luxury"}
            >Luxury</option
          >
          <option value="lemonade" selected={tenantData?.theme == "lemonade"}
            >Lemonade</option
          >
        </select>
      </div>
    </div>

    <div class="flex flex-row space-x-4">
      <div class="w-2/4 flex flex-col">
        <span class="mb-2 text-gray-400 font-medium text-sm"
          >{t("tenant.primary-color")}</span
        >
        <div class="w-full">
          <div class="relative flex">
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
              value={openAIKey}
              on:change={(event) => {
                openAIKey = event?.target?.value?.trim();
              }}
              on:focus={() => {
                showPicker = false;
              }}
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
              value={azureOpenAIKey}
              on:change={(event) => {
                azureOpenAIKey = event?.target?.value?.trim();
              }}
              on:focus={() => {
                showPicker = false;
              }}
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
            value={tenantData?.azure_openai_instance_name || ""}
            on:change={(event) => {
              tenantData.azure_openai_instance_name =
                event?.target?.value?.trim();
            }}
            on:focus={() => {
              showPicker = false;
            }}
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
            value={tenantData?.azure_openai_endpoint || ""}
            on:change={(event) => {
              tenantData.azure_openai_endpoint = event?.target?.value?.trim();
            }}
            on:focus={() => {
              showPicker = false;
            }}
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
            value={tenantData?.azure_openai_whisper_model || ""}
            on:change={(event) => {
              tenantData.azure_openai_whisper_model =
                event?.target?.value?.trim();
            }}
            on:focus={() => {
              showPicker = false;
            }}
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
            value={tenantData?.azure_openai_chat_model || ""}
            on:change={(event) => {
              tenantData.azure_openai_chat_model = event?.target?.value?.trim();
            }}
            on:focus={() => {
              showPicker = false;
            }}
          />
        </div>
      </div>
    </div>

    <!-- Included features -->
    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />
    <div class="mb-3"><b>{t("tenant.included-featured")}</b></div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="w-full bg-white rounded px-4 py-2"
      on:click={() => {
        showPicker = false;
      }}
    >
      <div class="flex items-center">
        <input
          id="feature-text-prompt"
          type="checkbox"
          checked={true}
          class="checkbox checkbox-primary"
          value="text-prompt"
          disabled
          on:change={(event) => {
            // TODO: Disabled this by default / could be unselect this Text Prompt feature in the future
          }}
        />
        <label class="label cursor-pointer ml-2" for="feature-text-prompt">
          <span class="label-text">{t("tenant.text-prompt")}</span>
        </label>
      </div>
      <div class="flex items-center mt-2 px-4">
        <input
          type="radio"
          id="radio-open-api-key"
          name="text-prompt-radio-api-key"
          class="radio radio-primary"
          value={ApiKeyProvider.OpenAI}
          checked={true}
          on:change={(event) => {
            selectFeatureApiKeyProvider(
              TenantFeature.TextPrompt.toString(),
              ApiKeyProvider.OpenAI.toString(),
            );
          }}
          on:focus={() => {
            showPicker = false;
          }}
        />
        <label for="radio-open-api-key" class="ml-2 font-medium text-sm"
          >{t("tenant.open-ai-model")}</label
        >
      </div>
      <div class="flex items-center mt-2 px-4">
        <input
          type="radio"
          id="radio-azure-open-api-key"
          name="text-prompt-radio-api-key"
          class="radio radio-primary"
          value={ApiKeyProvider.AzureOpenAI}
          checked={true}
          on:change={(event) => {
            selectFeatureApiKeyProvider(
              TenantFeature.TextPrompt.toString(),
              ApiKeyProvider.AzureOpenAI.toString(),
            );
          }}
          on:focus={() => {
            showPicker = false;
          }}
        />
        <label for="radio-azure-open-api-key" class="ml-2 font-medium text-sm"
          >{t("tenant.azure-open-ai-model")}</label
        >
      </div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="w-full bg-white rounded px-4 py-2 flex items-center mt-4"
      on:click={() => {
        showPicker = false;
      }}
    >
      <input
        id="feature-audio-to-text"
        type="checkbox"
        checked={tenantData?.included_features != undefined &&
          hasFeatureAudioToText()}
        class="checkbox checkbox-primary"
        value="audio-to-text"
        on:change={(event) => {
          // TODO: Update handle feature selected here using new data structure
          const feature = event.target.value;
          const indexToRemove = (tenantData?.included_features || []).indexOf(
            feature,
          );
          let newIncludedFeatures = tenantData?.included_features || [];
          if (indexToRemove !== -1) {
            newIncludedFeatures.splice(indexToRemove, 1);
          } else {
            newIncludedFeatures.push(feature);
          }
          tenantData.included_features = newIncludedFeatures;
        }}
      />
      <label class="label cursor-pointer ml-2" for="feature-audio-to-text">
        {@html svgIcons.audioToText}
        <span class="label-text ml-2">{t("tenant.audio-to-text")}</span>
      </label>
    </div>

    <ConfirmUpdateDialog
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
