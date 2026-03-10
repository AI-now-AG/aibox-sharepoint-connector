# <p align="center" width="100%"> <img src="./logo.png" width="250" height="250"> </p>
# <p align="center" width="100%"> aibox SharePoint Connector OIH Connector </p>

## Description

A generated OIH connector for the aibox SharePoint Connector API (version 1.0.0).

Generated from: https://api.aibox-app.com <br/>
Generated at: 2026-03-10T14:55:58+05:30 <br/>
Snapshot key: 

## API Description

SharePoint connector for aibox. Syncs files from SharePoint into the aibox Knowledge Base.<br/>
Used by FlowMate to automatically create, update, and delete documents when SharePoint content changes.<br/>

## Authorization

Supported authorization schemes:
- API Key
 - API key for connector authentication

## Actions

### undefined

### Create, update, or delete a file in Vector KB
> Receives file sync updates from an external connector.<br/>
> - When `is_deleted` is false: downloads the file from `download_url`, chunks it, generates embeddings, and stores chunks.<br/>
> - When `is_deleted` is true: removes the data source and all associated chunks.<br/>
> - Idempotent on `external_file_id` within a folder -- calling with the same ID updates rather than duplicates.<br/>

## License

: aibox-sharepoint-connector<br/>
                    <br/>

All files of this connector are licensed under the Apache 2.0 License. For details
see the file LICENSE on the toplevel directory.
