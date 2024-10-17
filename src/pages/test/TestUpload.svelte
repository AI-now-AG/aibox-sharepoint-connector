<script>
  import { onMount } from "svelte";
  import { transcription } from "$stores/transcription";
  import { addToast } from "$stores/toast";

  let files;
  let intervalId;
  let tempOutputFileName = "";
  let output = "";

  onMount(async () => {
    // setInterval(() => {
    //   console.log("Test setInterval()");
    // }, 5000);
  });

  $: if (files) {
    // Note that `files` is of type `FileList`, not an Array:
    // https://developer.mozilla.org/en-US/docs/Web/API/FileList
    console.log(files);

    for (const file of files) {
      console.log(`${file.name}: ${file.size} bytes`);
    }
  }

  async function startTranscribe(event) {
    console.log("event", event);

    const file = files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    // Get a SAS token and upload URL from your server
    const sasResponse = await fetch("/.netlify/functions/getSASToken");
    const { uploadUrl, outputFileName } = await sasResponse.json();

    console.log("getSASToken response", { uploadUrl, outputFileName });

    // Upload the file directly to Azure Blob Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type,
      },
    });

    if (uploadResponse.ok) {
      const uploadResponseText = await uploadResponse.text();
      console.log("upload temp response.", { uploadResponseText });

      // Convert the file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = async function () {
        const base64Data = reader.result.split(",")[1];

        if (!base64Data) {
          console.error("Failed to encode file as base64");
          return;
        }

        try {
          const response = await fetch(
            "/.netlify/functions/uploadAudio-background",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: file.name,
                uploadUrl: uploadUrl,
                mimeType: file.type,
              }),
            },
          );
          tempOutputFileName = `${outputFileName}_output.txt`;
          console.log("tempOutput file name", tempOutputFileName);

          const responseText = await response.text();
          console.log("uploadAudio-background response.", {
            response,
            responseText,
          });

          if (response.ok) {
            startPolling();
          } else {
            console.error("Error uploading audio:", response.statusText);
          }
        } catch (error) {
          console.error("Fetch error:", error);
        }
      };

      reader.onerror = function (error) {
        console.error("Error reading file:", error);
      };
    }
  }

  async function checkFileExistence() {
    try {
      const response = await fetch("/.netlify/functions/checkFileExist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: tempOutputFileName }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("checkFileExistence result", result);

        if (result.exists) {
          output = result.transcription;
          addToast({
            message: "File found! Your transcription is ready",
            type: "success",
          });

          clearInterval(intervalId);
          console.log("File found! Fetching transcription...");
        } else {
          console.log("File not found yet, checking again...");
        }
      }
    } catch (error) {
      console.error("Error checking file existence:", error);
    }
  }

  function startPolling() {
    intervalId = setInterval(checkFileExistence, 5000); // Check every 5 seconds
  }
</script>

{#if $transcription}
  <section class="my-5">
    <label for="avatar">Upload a mp3</label>
    <input accept="audio/mpeg" bind:files id="file" name="file" type="file" />
    <br />
    <button class="btn btn-primary" on:click|preventDefault={startTranscribe}
      >Transcribe</button
    >
  </section>

  <section>
    <div>
      {JSON.stringify($transcription)}
    </div>

    <textarea class="mt-6 w-full bg-primary" bind:value={output} rows="15"
    ></textarea>
  </section>
{/if}
