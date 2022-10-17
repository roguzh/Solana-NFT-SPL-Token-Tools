
# rOguzh Solana NFT/SPL-Token Tools

This repository includes a set of tool allowing users to handle certain operations such as:
- [SPL token creation with metadata](#spl-token-creation-with-metadata)
- [SPL token metadata update](#spl-token-metadata-update)
- [Add metadata to existing token](#Add-metadata-to-existing-token)
- [Upload files to Arweave](#Upload-files-to-Arweave)
- [Extract Hashlist from Candy Machine or 1st Verified Creator](#Extract-hashlist)
- [Snapshot Holders](#Snapshot-holders)
- [Snapshot Metadata of NFTs](#Snapshot-metadata)

**This tool set is made for SPL Tokens that follows [The Fungible Standard](https://docs.metaplex.com/programs/token-metadata/token-standard#the-fungible-standard) of Metaplex  (commonly referenced as `Whitelist Token`). Do not use it for NFTs as it is most likely to break NFT's structure.**

> ⚠️ **This repository has not been formally audited. Use it at your own risk.**

## Installation

```
git clone https://github.com/roguzh/Solana-NFT-SPL-Token-Tools.git && cd "Solana NFT SPL Token Tools" && yarn install
```

## Common Options
These options are required for all the features included in this tool set. 
### Keypair (Required)
There are 2 ways to specify the keypair. You have to use one of them.
- `--private-key <private_key>`
- `--keypair <path_to_keypair_file>`
### RPC (Required)
RPC URL is required and none of the features can be executed without. RPC URL also defines the selected cluster.

`--rpc-url <rpc_url>`

## SPL token creation with metadata
This feature allows you to create an SPL token with specified options such as: `token decimals`, `freeze`, `metadata`.
### Options
#### Token Decimals (Optional)
This option sets the decimals of the created token. The default value is `0`.
- `--decimals <number>`
#### Disable Freeze (Optional)
This options sets `Freeze Authority` of created token, to `null`. By default, provided keypair hold the `Freeze Authority`.
- `--disable-freeze`
#### Metadata (Required)
This option sets URI to the Metadata of the token. It follows The Fungible Standard of Metaplex.
There are 2 ways to set the metadata and you have to use one of them:
- `--upload-metadata <name-of-file>` : Use this option if you want to upload a local metadata file and use it for the token. Check [**`assets/example-metadata.json`**](https://github.com/roguzh/Solana-metadata-manager/blob/master/assets/example-metadata.json).
- `--metadata-uri <uri>` : Use this option if you want to use an existing URL to refer as metadata.

### Example Usage
```
ts-node index.ts create-token-with-metadata 
        --private-key private_key_of_the_authority_wallet
        --rpc-url https://api.devnet.solana.com
        --decimals 0
        --upload-metadata example-metadata.json
```

## SPL Token metadata update
This feature allows you to update the metadata, name and symbol of an SPL token.
### Options
#### Token Address (Required)
Address of the token you want to update its metadata. Provided wallet has to be the `Update Authority` else you will receive an error.
- `--token-address <mint-address>`
#### Metadata (Required)
This option sets URI to the Metadata of the token. It follows The Fungible Standard of Metaplex.
There are 2 ways to set the metadata and you have to use one of them:
- `--upload-metadata <name-of-file>` : Use this option if you want to upload a local metadata file and use it for the token. Check [**`assets/example-metadata.json`**](https://github.com/roguzh/Solana-metadata-manager/blob/master/assets/example-metadata.json).
- `--metadata-uri <uri>` : Use this option if you want to use an existing URL to refer as metadata.

### Example Usage
```
ts-node index.ts update-existing-metadata 
        --private-key private_key_of_the_authority_wallet
        --rpc-url https://api.devnet.solana.com
        --token-address token_address
        --metadata-uri https://arweave.net/2jsnetZxCjK4juyQZS1Fpj_zc3oj1wB6tgV9mpzpFeM
```

## Add metadata to existing token
This feature allows you to add metadata to existing token. This feature is supported only for tokens that follows The Fungible Standard of Metaplex
### Options
#### Token Address (Required)
Address of the token you want to update its metadata. Provided wallet has to be the `Update Authority` else you will receive an error.
- `--token-address <mint-address>`
#### Metadata (Required)
This option sets URI to the Metadata of the token. It follows The Fungible Standard of Metaplex.
There are 2 ways to set the metadata and you have to use one of them:
- `--upload-metadata <name-of-file>` : Use this option if you want to upload a local metadata file and use it for the token. Check [**`assets/example-metadata.json`**](https://github.com/roguzh/Solana-metadata-manager/blob/master/assets/example-metadata.json).
- `--metadata-uri <uri>` : Use this option if you want to use an existing URL to refer as metadata.

### Example Usage
```
ts-node index.ts add-metadata 
        --private-key private_key_of_the_authority_wallet
        --rpc-url https://api.devnet.solana.com
        --token-address token_address
        --upload-metadata example-metadata.json
```

## Upload files to Arweave
Allows you to upload file to Arweave. 
### Options
#### File Path (Required)
Path to the file you want to update.
- `--file-path <path>`
### Example Usage
```
ts-node index.ts upload-file 
        --private-key private_key_of_the_authority_wallet
        --rpc-url https://api.devnet.solana.com
        --file-path assets/example-metadata.json
```

## Extract hashlist
This feature allows users to extract hashlist of a collection (given Candy Machine or 1st verified creator address) using Metaplex JS SDK functions.
### Options
#### 1st Verified Creator or Candy Machine Address (Required)
Address of the 1st verified creator of NFTs or the Candy Machine of the collection. Use one of the below options.
- `--creator-address <address>`
- `--candy-machine <address>` 

### Example Usage
```
ts-node index.ts get-hashlist 
        --rpc-url https://api.devnet.solana.com
        --candy-machine cm_v2_address
```

## Snapshot holders
This feature allows users to snapshot holders of a given hashlist (json array formatted).
### Options
#### Hashlist path (Required)
Path to the hashlist file
- `--hashlist-path <path>` 

### Example Usage
```
ts-node index.ts snapshot-holders 
        --rpc-url https://api.devnet.solana.com
        --hashlist-path hashlist.json
```

## Snapshot metadata
This feature allows users to snapshot all the metadata of a given hashlist (json array formatted).
### Options
#### Hashlist path (Required)
Path to the hashlist file
- `--hashlist-path <path>` 

### Example Usage
```
ts-node index.ts snapshot-metadata 
        --rpc-url https://api.devnet.solana.com
        --hashlist-path hashlist.json
```
