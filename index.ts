import { Command } from 'commander';
import { createTokenWithMetadata, addMetadataToExistingToken, updateExistingTokenMetadata } from './functions';
import { getKeypair, verifyMetadataOption } from './tools';
import { uploadFile } from './upload';

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
        const metadataURI = verifyMetadataOption(
            options.metadataURI,
            options.uploadMetadata
        );

        await createTokenWithMetadata(
            options.decimals,
            options.disableFreeze || false,
            metadataURI,
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
        const metadataURI = verifyMetadataOption(
            options.metadataURI,
            options.uploadMetadata
        );

        await addMetadataToExistingToken(
            metadataURI,
            options.tokenAddress,
            keypair,
            options.rpcUrl
        )

    });

program.command("update-existing-metadata")
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
        const metadataURI = verifyMetadataOption(
            options.metadataURI,
            options.uploadMetadata
        );

        await updateExistingTokenMetadata(
            metadataURI,
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

        if(uri) {
            console.log(`\tFile has been uploaded successfully\n\tLink: ${uri}`);
        } else {
            console.log(`\tAn error has occurred while uploading file!`);
        }
        
    });

program.parse();