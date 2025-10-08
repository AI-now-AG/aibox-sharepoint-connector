// [Example] url = "https://ainowstorage.blob.core.windows.net/fileuploadcontainer/ai-now-dev/1e681dd5-5541-420b-a9f6-8166c1c2b204-19_2_24_MAC_MINI.docx?sv=2025-05-05&se=2025-09-08T09%3A13%3A57Z&sr=b&sp=r&sig=ZvtgSZXDYILwFSbnJjZ5uVzmqifHxOQwE5AfqeHlc44%3D";
export function getFileNameFromAzureUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Split the pathname to get the last part which contains the file name
    const parts = pathname.split("/");
    const fileNameWithGuid = parts[parts.length - 1];

    // Regex to match a GUID followed by a dash
    // The regex pattern is:
    // ^ - asserts the start of the string
    // [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12} - matches a standard GUID
    // - - matches the hyphen after the GUID
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/;

    // Use replace with the regex to remove the GUID prefix
    const fileName = fileNameWithGuid.replace(guidRegex, "");

    // If the result is an empty string, return null
    return fileName || null;
  } catch (error) {
    console.error("Error extracting file name:", error);
    return null;
  }
}
