import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid'; // To generate unique file names

const getSASToken = async () => {
    try {
        let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
        console.log(storageURLString)
        const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
        const containerName = 'transcribecontainer';
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const uniqueFilename = uuidv4();
        const blobName = `${uniqueFilename}.mp3`;

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
            body: JSON.stringify({ uploadUrl: sasToken, outputFileName: uniqueFilename })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
              message: "Error during file uploading.",
            }),
          };
    }
};

export { getSASToken as handler };