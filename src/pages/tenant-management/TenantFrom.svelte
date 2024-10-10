<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<script>
  import { actions } from "astro:actions";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import Loading from "$components/Loading.svelte";
  import { loading, showLoading, hideLoading } from "$stores";
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker";

  const API_KEY_PROVIDER = {
    OpenAI: "openai",
    AzureOpenAI: "azure_openai",
  };
  const MODE = {
    Create: "create",
    Edit: "edit",
  };
  const t = useTranslations();

  export let tenant;
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

  let apiKeyProvider = tenantData?.api_key_provider || API_KEY_PROVIDER.OpenAI;
  function selectApiKeyProvider(event) {
    apiKeyProvider = event.target.value?.trim();
    tenantData.api_key_provider = apiKeyProvider;
  }

  function showUpdateConfirmationModal() {
    document.getElementById("modal_confirm_update").showModal();
  }

  function closeUpdateConfirmationModal() {
    document.getElementById("modal_confirm_update").close();
  }

  let icon_open_ai = svgIcons.eye_close;
  let icon_azure_open_ai = svgIcons.eye_close;
  function togglePassword(_apiKeyProvider) {
    let passwordField = document.getElementById("open_ai_key");
    if (_apiKeyProvider == API_KEY_PROVIDER.AzureOpenAI) {
      passwordField = document.getElementById("azure_open_ai_key");
    }
    if (passwordField.type === "password") {
      passwordField.type = "text";

      if (_apiKeyProvider == API_KEY_PROVIDER.OpenAI) {
        icon_open_ai = svgIcons.eye;
      }
      if (_apiKeyProvider == API_KEY_PROVIDER.AzureOpenAI) {
        icon_azure_open_ai = svgIcons.eye;
      }
    } else {
      passwordField.type = "password";
      if (_apiKeyProvider == API_KEY_PROVIDER.OpenAI) {
        icon_open_ai = svgIcons.eye_close;
      }
      if (_apiKeyProvider == API_KEY_PROVIDER.AzureOpenAI) {
        icon_azure_open_ai = svgIcons.eye_close;
      }
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
    if (apiKeyProvider == API_KEY_PROVIDER.OpenAI) {
      if (!tenantData?.openai_api_key) {
        showAlert(t("tenant.validate-open-ai-key-message"));
        return false;
      }
    } else {
      if (!tenantData?.azure_openai_api_key) {
        showAlert(t("tenant.validate-azure-open-ai-key-message"));
        return false;
      }
    }

    return true;
  }

  async function createTenant() {
    if (validateForm()) {
      try {
        showLoading();
        const { error } = await actions.tenant.create(tenantData);
        hideLoading();
        if (error) {
          showAlert(error);
        } else {
          addToast({
            message: t("tenant.create-successful"),
            type: "success",
          });
          window.history.back();
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
    document.getElementById("alert_message").textContent = message;
    document.getElementById("my_modal_3").showModal();
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
          mode == MODE.Edit ? showUpdateConfirmationModal() : createTenant();
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
          value={tenant?.name || ""}
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
          value={tenant?.org_name || ""}
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
        <div class="flex items-center mb-2">
          <input
            type="radio"
            id="radio-azure-open-api-key"
            name="radio-api-key"
            class="radio radio-primary"
            value={API_KEY_PROVIDER.OpenAI}
            checked={apiKeyProvider == API_KEY_PROVIDER.OpenAI}
            on:change={(event) => {
              selectApiKeyProvider(event);
            }}
            on:focus={() => {
              showPicker = false;
            }}
          />
          <label
            for="radio-azure-open-api-key"
            class="ml-2 text-gray-400 font-medium text-sm"
            >{t("tenant.open-ai-provider")}</label
          >
        </div>

        <label
          class="input input-bordered flex items-center gap-2"
          style="background-color: white;"
        >
          <input
            type="password"
            class="grow"
            id="open_ai_key"
            placeholder={t("tenant.api-key")}
            disabled={apiKeyProvider != API_KEY_PROVIDER.OpenAI}
            value={tenantData?.openai_api_key ?? ""}
            on:change={(event) => {
              tenantData.openai_api_key = event.target.value;
            }}
            on:focus={() => {
              showPicker = false;
            }}
          />
          <button
            on:click={() => {
              togglePassword(API_KEY_PROVIDER.OpenAI);
            }}
          >
            {@html icon_open_ai}
          </button>
        </label>
      </div>

      <div class="flex-1 flex flex-col">
        <div class="flex items-center mb-2">
          <input
            type="radio"
            id="radio-open-api-key"
            name="radio-api-key"
            class="radio radio-primary"
            value={API_KEY_PROVIDER.AzureOpenAI}
            checked={apiKeyProvider == API_KEY_PROVIDER.AzureOpenAI}
            on:change={(event) => {
              selectApiKeyProvider(event);
            }}
            on:focus={() => {
              showPicker = false;
            }}
          />
          <label
            for="radio-open-api-key"
            class="ml-2 text-gray-400 font-medium text-sm"
            >{t("tenant.azure-open-ai-provider")}</label
          >
        </div>

        <label
          class="input input-bordered flex items-center gap-2"
          style="background-color: white;"
        >
          <input
            type="password"
            class="grow"
            id="azure_open_ai_key"
            placeholder={t("tenant.api-key")}
            disabled={apiKeyProvider != API_KEY_PROVIDER.AzureOpenAI}
            style="background-color: white;"
            value={tenantData?.azure_openai_api_key ?? ""}
            on:change={(event) => {
              tenantData.azure_openai_api_key = event.target.value;
            }}
            on:focus={() => {
              showPicker = false;
            }}
          />
          <button
            on:click={() => {
              togglePassword(API_KEY_PROVIDER.AzureOpenAI);
            }}
          >
            {@html icon_azure_open_ai}
          </button>
        </label>
      </div>
    </div>

    <div class="w-full h-0.5 mt-4 mb-6 bg-gray-400/20" />

    <div class="mb-3"><b>{t("tenant.included-featured")}</b></div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="w-full bg-white rounded px-4 py-2 flex items-center"
      on:click={() => {
        showPicker = false;
      }}
    >
      <input
        id="feature-audio-to-text"
        type="checkbox"
        checked={tenantData?.included_features != undefined &&
          tenantData?.included_features?.indexOf("audio-to-text") != -1}
        class="checkbox checkbox-primary"
        value="audio-to-text"
        on:change={(event) => {
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
        {@html svgIcons["audio-to-text"]}
        <span class="label-text ml-2">{t("tenant.audio-to-text")}</span>
      </label>
    </div>

    <dialog id={"modal_confirm_update"} class="modal">
      <div class="modal-box">
        <form method="dialog" id="modalForm">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >✕</button
          >
          <h3 id="modal_title" class="text-lg font-bold">
            {t("tenant.tenants.tenant.update-confirmation")}
          </h3>
          <div class="flex justify-between gap-4 mt-6">
            <button
              id="yes_button"
              class="btn btn-warning flex-1"
              on:click={() => {
                updateTenant();
              }}>{t("common.yes")}</button
            >
            <button
              id="no_button"
              class="btn btn-success flex-1"
              on:click={() => {
                closeUpdateConfirmationModal();
              }}>{t("common.no")}</button
            >
          </div>
        </form>
      </div>
    </dialog>

    <dialog id="my_modal_3" class="modal">
      <div class="modal-box">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >✕</button
          >
        </form>
        <p id="alert_message" style="color: rgb(159 18 57);"></p>
      </div>
    </dialog>
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
