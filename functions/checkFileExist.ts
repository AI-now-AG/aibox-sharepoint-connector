import { BlobServiceClient } from '@azure/storage-blob';
import { type Handler } from '@netlify/functions';
import { join } from "path";
import { tmpdir } from "os";
import AdmZip from "adm-zip";
import { createWriteStream, unlinkSync, existsSync } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

const checkFileExist: Handler = async (event, context) => {
    const { fileNames } = JSON.parse(event.body!);
    if (fileNames) {
        const streamPipeline = promisify(pipeline); 
        const tmpDir = tmpdir();
        let storageURLString: string = process.env.AZURE_BLOB_STORAGE_NAME || "";
        console.log(storageURLString)

        const blobServiceClient = BlobServiceClient.fromConnectionString(storageURLString);
        const containerName = 'transcribecontainer';
        const containerClient = blobServiceClient.getContainerClient(containerName);
        console.log("File:" + fileNames);
        const downloadedFiles: { name: string; path: string }[] = [];
        try {
            // Check if the file exists in Azure Blob Storage
            for (const fileName of fileNames) {
                const blobClient = containerClient.getBlobClient(fileName);
                const exists = await blobClient.exists();

                if (!exists) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ exists: false, message: 'File does not exist' }),
                    };
                }

                const filePath = join(tmpDir, fileName);
                const downloadBlockBlobResponse = await blobClient.download();

                // Ensure the file is written to the file system
                const fileStream = createWriteStream(filePath);
                await streamPipeline(downloadBlockBlobResponse.readableStreamBody!, fileStream);

                downloadedFiles.push({ name: fileName, path: filePath });

                
                //const downloadBlockBlobResponse = await blobClient.download()
                //const downloadedContent = await streamToString(downloadBlockBlobResponse.readableStreamBody!);
            }
            console.log(downloadedFiles)
            const zipBuffer = await createZip(downloadedFiles)
            // return {
            //     statusCode: 200,
            //     body: JSON.stringify({ exists: true, transcriptionFile: zipBuffer }),
            // };
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': 'attachment; filename="transcription_files.zip"',
                },
                body: zipBuffer.toString('base64'), // Convert the binary zip buffer to base64 for safe transmission
                isBase64Encoded: true, // Indicate the body is base64 encoded
            };
        } catch (error) {
            console.error('Error checking file existence or downloading content:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to check file existence or download content' }),
            };
        }
    } else {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get file list' }),
        };
    }

};

async function createZip(downloadedFiles: { name: string; path: string }[]): Promise<Buffer> {
    const zip = new AdmZip();

    // Add each file to the zip
    downloadedFiles.forEach((file) => {
        console.log(`Adding file to zip: ${file.path}`);
        zip.addLocalFile(file.path);
    });

    // Generate a buffer of the zip content
    const zipBuffer = zip.toBuffer();

    // Clean up: delete the downloaded files after zipping
    downloadedFiles.forEach((file) => {
        console.log(`Attempting to delete file: ${file.path}`);
        if (existsSync(file.path)) {
            try {
                unlinkSync(file.path); // Ensure file exists before deletion
                console.log(`File deleted: ${file.path}`);
            } catch (err) {
                console.error(`Failed to delete file: ${file.path}`, err);
            }
        } else {
            console.warn(`File not found during deletion: ${file.path}`);
        }
    });

    return zipBuffer;
}

// Helper function to convert readable stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        readableStream?.on("data", (data) => {
            chunks.push(data);
        });
        readableStream?.on("end", () => {
            resolve(Buffer.concat(chunks).toString("utf-8"));
        });
        readableStream?.on("error", reject);
    });
}

export { checkFileExist as handler };
