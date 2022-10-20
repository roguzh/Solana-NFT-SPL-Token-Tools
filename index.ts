import { PublicKey } from '@solana/web3.js';
import { Command } from 'commander';
import { createTokenWithMetadata, addMetadataToExistingToken, updateExistingSplTokenMetadata, uploadFile, getMetadata, getHashlistFromAddress, getMintersInformation, snapshotHolders, updateNftMetadata } from './functions';
import { getKeypair, verifyMetadataOption } from './tools';

const program = new Command();

console.log("\n");

program.command("create-token-with-metadata")
    .option('--private-key <private-key>', 'Private key to be used as authority of token and upload metadata.')
    .option('--keypair <path>', 'Path to the keypair file to be used as authority of token and upload metadata.')
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .option('--decimals <number>', 'Number of decimals.', '0')
    .option('--disable-freeze', 'Disable freeze.')
    .option('--upload-metadata <name-of-file>', 'Upload metadata from the given file-name. File should be placed inside "assets/" folder.')
    .option('--metadata-uri <uri>', 'URI containing metadata.')
    .action(async (options) => {

        const keypair = getKeypair(
            options.privateKey,
            options.keypair
        );
        const metadataUri = verifyMetadataOption(
            options.metadataUri,
            options.uploadMetadata
        );

        await createTokenWithMetadata(
            options.decimals,
            options.disableFreeze || false,
            metadataUri,
            keypair,
            options.rpcUrl
        );
    });

program.command("add-metadata")
    .option('--private-key <private-key>', 'Private key to be used as authority of token and upload metadata.')
    .option('--keypair <path>', 'Path to the keypair file to be used as authority of token and upload metadata.')
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--token-address <mint-address>', 'Address of the token to be updated.')
    .option('--upload-metadata <name-of-file>', 'Upload metadata from the given file-name. File should be placed inside "assets/" folder.')
    .option('--metadata-uri <uri>', 'URI containing metadata.')
    .action(async (options) => {

        const keypair = getKeypair(
            options.privateKey,
            options.keypair
        );
        const metadataUri = verifyMetadataOption(
            options.metadataUri,
            options.uploadMetadata
        );

        await addMetadataToExistingToken(
            metadataUri,
            options.tokenAddress,
            keypair,
            options.rpcUrl
        )

    });

program.command("update-existing-spl-metadata")
    .option('--private-key <private-key>', 'Private key to be used as authority of token and upload metadata.')
    .option('--keypair <path>', 'Path to the keypair file to be used as authority of token and upload metadata.')
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--token-address <mint-address>', 'Address of the token to be updated.')
    .option('--upload-metadata <name-of-file>', 'Upload metadata from the given file-name. File should be placed inside "assets/" folder.')
    .option('--metadata-uri <uri>', 'URI containing metadata.')
    .action(async (options) => {

        const keypair = getKeypair(
            options.privateKey,
            options.keypair
        );
        const metadataUri = verifyMetadataOption(
            options.metadataUri,
            options.uploadMetadata
        );

        await updateExistingSplTokenMetadata(
            metadataUri,
            options.tokenAddress,
            keypair,
            options.rpcUrl
        );

    });

program.command("update-nft-metadata")
    .option('--private-key <private-key>', 'Private key to be used as authority of token and upload metadata.')
    .option('--keypair <path>', 'Path to the keypair file to be used as authority of token and upload metadata.')
    .option('--metadata-uri <uri>', 'URI containing metadata.')
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--token-address <mint-address>', 'Address of the token to be updated.')
    .action(async (options) => {

        const keypair = getKeypair(
            options.privateKey,
            options.keypair
        );

        const metadataUri = verifyMetadataOption(
            options.metadataUri,
            null
        );

        await updateNftMetadata(
            metadataUri,
            options.tokenAddress,
            keypair,
            options.rpcUrl
        );

    });

program.command("upload-file")
    .option('--private-key <private-key>', 'Private key to be used as authority of token and upload metadata.')
    .option('--keypair <path>', 'Path to the keypair file to be used as authority of token and upload metadata.')
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--file-path <path>', 'Path to the file to be uploaded')
    .action(async (options) => {

        const keypair = getKeypair(
            options.privateKey,
            options.keypair
        );

        const uri = await uploadFile(
            options.filePath,
            keypair,
            options.rpcUrl
        )

        if (uri) {
            console.log(`\tFile has been uploaded successfully\n\tLink: ${uri}`);
        } else {
            console.log(`\tAn error has occurred while uploading file!`);
        }

    });

program.command("get-hashlist")
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .option('--creator-address <address>', 'Address of the first verified creator')
    .option('--candy-machine <address>', 'Address of the candy machine(v2)')
    .action(async (options) => {

        await getHashlistFromAddress(
            options.candyMachine ? new PublicKey(options.candyMachine) : new PublicKey(options.creatorAddress),
            options.rpcUrl,
            options.candyMachine ? true : false
        );

    });

program.command("snapshot-holders")
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--hashlist-path <path>', 'Path to the hashlist file')
    .option('--diamond-vault-wallet <wallet-address>', 'Address of Diamond Vault\'s escrow wallet')
    .action(async (options) => {

        await snapshotHolders(
            options.hashlistPath,
            options.rpcUrl,
            options.diamondVaultWallet || null
        );

    });

program.command("snapshot-metadata")
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--hashlist-path <path>', 'Path to the hashlist file')
    .action(async (options) => {

        await getMetadata(
            options.hashlistPath,
            options.rpcUrl
        );

    });

program.command("get-minters-information")
    .requiredOption('--rpc-url <rpc>', 'RPC of the network to be used.')
    .requiredOption('--hashlist-path <path>', 'Path to the hashlist file')
    .action(async (options) => {

        await getMintersInformation(
            options.hashlistPath,
            options.rpcUrl
        );

    });

program.parse();