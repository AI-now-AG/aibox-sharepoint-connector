import { BlobServiceClient, BlobSASPermissions } from "@azure/storage-blob";
import { type Handler } from "@netlify/functions";
import { v4 as uuidv4 } from "uuid"; // To generate unique file names

const getSASToken: Handler = async (event) => {
  const { fileNameWithoutExtension, folderName } = JSON.parse(event.body!);

  if (!fileNameWithoutExtension || !folderName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields: fileNameWithoutExtension or folderName" }),
    };
  }
  try {
    const storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
    console.log(storageURLString);
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
    const containerName = process.env.AZURE_CONTAINER_NAME || "transcribecontainer";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();
    const uniqueFilename = uuidv4();
    const fileName = `${fileNameWithoutExtension}_${uniqueFilename}`;
    const blobName = `${folderName}/${fileName}.mp3`;

    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Create a SAS token
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10); // SAS valid for 10 minutes

    // Define permissions using BlobSASPermissions
    const permissions = new BlobSASPermissions();
    permissions.create = true;
    permissions.execute = true;
    permissions.move = true;
    permissions.read = true;
    permissions.write = true;

    const sasToken = await blobClient.generateSasUrl({
      permissions: permissions,
      expiresOn: expiryDate,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: sasToken, outputFileName: fileName }),
    };
  } catch (error) {
    console.error("Error during SAS token generation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error during file uploading.",
      }),
    };
  }
};

export { getSASToken as handler };
