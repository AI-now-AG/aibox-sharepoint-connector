<script>
  import { actions } from "astro:actions";

  //   Used for Encryption
  let orginalEncryptKey = "";
  let encryptedKey = "";

  //   Used for Decryption
  let originalDecryptKey = "";
  let decryptedKey = "";

  async function encryptKey() {
    try {
      const { data } = await actions.tenant.encryptApiKeys({
        openai_api_key: orginalEncryptKey,
      });
      if (data) {
        const { openai_api_key } = data;
        encryptedKey = openai_api_key;
      }
    } catch (error) {
      log.e(error, "Descript orginalEncryptKey error");
    }
  }

  async function decryptKey() {
    try {
      const { data } = await actions.tenant.decryptApiKeys({
        openai_api_key: originalDecryptKey,
      });
      if (data) {
        const { openai_api_key } = data;
        decryptedKey = openai_api_key;
      }
    } catch (error) {
      log.e(error, "Descript originalDecryptKey error");
    }
  }
</script>

<div class="container max-w-full mx-auto p-6" style="font-family: Inter;">
  <div class="max-w-full">
    <label
      class="input input-bordered flex items-center gap-2"
      style="background-color: white;"
    >
      <input
        type="text"
        class="grow"
        id="raw_key"
        placeholder={"Enter Raw API key you would like to Encrypt"}
        value={orginalEncryptKey}
        on:change={(event) => {
          orginalEncryptKey = event.target.value;
        }}
      />
    </label>
    <div>
      <textarea class="mt-2 text-xs text-grey-500" style="width: 100%; color: red;" rows="3"
        >{encryptedKey}</textarea
      >
    </div>
    <button
      class="btn btn-active btn-success mt-4"
      on:click={() => {
        encryptKey();
      }}
    >
      Encrypt
    </button>
  </div>

  <div class="max-w-full mt-20">
    <label
      class="input input-bordered flex items-center gap-2"
      style="background-color: white;"
    >
      <input
        type="text"
        class="grow"
        id="encrypt_key"
        placeholder={"Enter Encrypted Key you would like to Decrypt"}
        value={originalDecryptKey}
        on:change={(event) => {
          originalDecryptKey = event.target.value;
        }}
      />
    </label>
    <div>
      <textarea class="mt-2 text-xs text-grey-500" style="width: 100%; color: green;" rows="3"
        >{decryptedKey}</textarea
      >
    </div>

    <button
      class="btn btn-active btn-warning mt-4"
      on:click={() => {
        decryptKey();
      }}
    >
      Descrypt
    </button>
  </div>
</div>

<style>
</style>
