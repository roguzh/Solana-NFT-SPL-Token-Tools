import { findMetadataPda, lamports } from "@metaplex-foundation/js";
import { createCreateMetadataAccountV2Instruction, createUpdateMetadataAccountV2Instruction, DataV2, keyBeet } from "@metaplex-foundation/mpl-token-metadata";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { verifyOrUploadSPLTokenMetadata } from "./tools";

export async function createTokenWithMetadata(
    decimals: number,
    disableFreeze: boolean,
    metadataURI: string,
    authority_keypair: Keypair,
    rpc: string
) {
    const connection = new Connection(rpc);
    const mint_keypair = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const metadataPDA = await findMetadataPda(new PublicKey(mint_keypair.publicKey));

    const verifiedURI = await verifyOrUploadSPLTokenMetadata(metadataURI, authority_keypair, rpc);

    if (!verifiedURI) {
        console.log(`An error occurred while verifying/uploading metadata URI. Please double-check!`);
        process.exit(-1);
    }

    const metadata = await (await fetch(verifiedURI)).json();

    const tokenMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: verifiedURI,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    } as DataV2;

    console.log(`\tToken address: ${mint_keypair.publicKey}`);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: authority_keypair.publicKey,
            newAccountPubkey: mint_keypair.publicKey,
            space: MINT_SIZE,
            lamports: lamports,
            programId: TOKEN_PROGRAM_ID
        }),
        createInitializeMint2Instruction(
            mint_keypair.publicKey,
            decimals,
            authority_keypair.publicKey,
            disableFreeze ? null : authority_keypair.publicKey,
            TOKEN_PROGRAM_ID
        ),
        createCreateMetadataAccountV2Instruction({
            metadata: metadataPDA,
            mint: new PublicKey(mint_keypair.publicKey),
            mintAuthority: authority_keypair.publicKey,
            payer: authority_keypair.publicKey,
            updateAuthority: authority_keypair.publicKey,
        },
            {
                createMetadataAccountArgsV2:
                {
                    data: tokenMetadata,
                    isMutable: true
                }
            }
        )
    );

    try {
        const result = await sendAndConfirmTransaction(connection, transaction, [authority_keypair, mint_keypair]);
        console.log(`\tSuccessful Transaction: ${result}`);
        return result;
    } catch (err) {
        console.log(`\tAn error has occurred: ${err}`);
        return null;
    }
}

export async function updateExistingTokenMetadata(
    metadataURI: string,
    tokenAddress: string,
    keypair: Keypair,
    rpc: string
) {
    const connection = new Connection(rpc);
    const metadataPDA = await findMetadataPda(new PublicKey(tokenAddress));
    const verifiedURI = await verifyOrUploadSPLTokenMetadata(metadataURI, keypair, rpc);

    if (!verifiedURI) {
        console.log(`An error occurred while verifying/uploading metadata URI. Please double-check!`);
        process.exit(-1);
    }

    const metadata = await (await fetch(verifiedURI)).json();

    const tokenMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: verifiedURI,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    } as DataV2;

    const transaction = new Transaction().add(
        createUpdateMetadataAccountV2Instruction(
            {
                metadata: metadataPDA,
                updateAuthority: keypair.publicKey,
            },
            {
                updateMetadataAccountArgsV2: {
                    data: tokenMetadata,
                    updateAuthority: keypair.publicKey,
                    primarySaleHappened: true,
                    isMutable: true,
                },
            }
        )
    );

    try {
        const result = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log(`\tSuccessful Transaction: ${result}`);
        return result;
    } catch (err) {
        console.log(`\tAn error has occurred: ${err}`);
        return null;
    }
}

export async function addMetadataToExistingToken(
    metadataURI: string,
    tokenAddress: string,
    keypair: Keypair,
    rpc: string
) {
    const connection = new Connection(rpc);
    const metadataPDA = await findMetadataPda(new PublicKey(tokenAddress));

    const verifiedURI = await verifyOrUploadSPLTokenMetadata(metadataURI, keypair, rpc);

    if (!verifiedURI) {
        console.log(`An error occurred while verifying/uploading metadata URI. Please double-check!`);
        process.exit(-1);
    }

    const metadata = await (await fetch(verifiedURI)).json();

    const tokenMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: verifiedURI,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    } as DataV2;


    const transaction = new Transaction().add(
        createCreateMetadataAccountV2Instruction({
            metadata: metadataPDA,
            mint: new PublicKey(tokenAddress),
            mintAuthority: keypair.publicKey,
            payer: keypair.publicKey,
            updateAuthority: keypair.publicKey,
        },
            {
                createMetadataAccountArgsV2:
                {
                    data: tokenMetadata,
                    isMutable: true
                }
            }
        )
    );

    try {
        const result = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log(`\tSuccessful Transaction: ${result}`);
        return result;
    } catch (err) {
        console.log(`\tAn error has occurred: ${err}`);
        return null;
    }
}