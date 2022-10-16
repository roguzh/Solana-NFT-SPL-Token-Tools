import { bundlrStorage, findAssociatedTokenAccountPda, findMetadataPda, lamports, Metaplex, toMetaplexFile, walletAdapterIdentity } from "@metaplex-foundation/js";
import { createCreateMetadataAccountV2Instruction, createUpdateMetadataAccountV2Instruction, DataV2, keyBeet, Metadata, TriedToReplaceAnExistingReservationError } from "@metaplex-foundation/mpl-token-metadata";
import { createInitializeMint2Instruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionResponse } from "@solana/web3.js";
import { verifyOrUploadSPLTokenMetadata, BASE_FOLDER } from "./tools";
import { readFileSync, writeFileSync } from "fs";

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

export async function uploadSPLTokenMetadata(splTokenMetadataFileName: string, keypair: Keypair, rpc: string) {
    try {
        const connection = new Connection(rpc);
        const metaplex = new Metaplex(connection);
        console.log(`\tUsing wallet address: ${keypair.publicKey.toString()}\t`);

        let bundlrProvider = 'https://devnet.bundlr.network';

        if (rpc !== 'devnet' && rpc !== 'https://api.devnet.solana.com') {
            bundlrProvider = "https://node1.bundlr.network";
        }

        metaplex.use(walletAdapterIdentity(keypair));
        metaplex.use(
            bundlrStorage({
                address: bundlrProvider,
                providerUrl: rpc,
                timeout: 60000,
                identity: keypair,
            }),
        );

        const splTokenMetadata = JSON.parse(readFileSync(BASE_FOLDER + splTokenMetadataFileName, 'utf-8'));
        const imageFileBuffer = readFileSync(BASE_FOLDER + splTokenMetadata.image);

        const metaplexImageFile = toMetaplexFile(
            imageFileBuffer,
            splTokenMetadata.image
        );

        return await metaplex.nfts().uploadMetadata({
            name: splTokenMetadata.name,
            symbol: splTokenMetadata.symbol,
            description: splTokenMetadata.description,
            image: metaplexImageFile
        }).run();

    } catch (err) {
        console.log(err);
        return null
    }
}

export async function uploadFile(filePath: string, keypair: Keypair, rpc: string) {
    try {
        const connection = new Connection(rpc);
        const metaplex = new Metaplex(connection);
        console.log(`\tUsing wallet address: ${keypair.publicKey.toString()}\n`);

        let bundlrProvider = 'https://devnet.bundlr.network';

        if (rpc !== 'devnet' && rpc !== 'https://api.devnet.solana.com') {
            bundlrProvider = "https://node1.bundlr.network";
        }

        metaplex.use(walletAdapterIdentity(keypair));
        metaplex.use(
            bundlrStorage({
                address: bundlrProvider,
                providerUrl: rpc,
                timeout: 60000,
                identity: keypair,
            }),
        );

        const fileBuffer = readFileSync(filePath);
        const metaplexFile = toMetaplexFile(
            fileBuffer,
            filePath
        )

        const res = await metaplex.storage().upload(metaplexFile);
        return res;

    } catch (err) {
        console.log(err);
        return null
    }

}

export async function getHashlistFromAddress(address: PublicKey, rpc: string, isCandyMachine: boolean) {
    const connection = new Connection(rpc);
    const metaplex = new Metaplex(connection);

    console.log(`\n\tStarting to fetch NFTs...`);
    let hashlist: Array<string> = [];

    if (isCandyMachine) {
        hashlist = (await metaplex.candyMachines().findMintedNfts({
            candyMachine: address
        }).run()).map(e => {
            if (e.model == "metadata") {
                return e.mintAddress.toBase58();
            } else {
                return e.mint.address.toBase58()
            }
        });
    } else {
        hashlist = (await metaplex.nfts().findAllByCreator({
            creator: address
        }).run()).map(e => {
            if (e.model == "metadata") {
                return e.mintAddress.toBase58();
            } else {
                return e.mint.address.toBase58()
            }
        });
    }

    console.log(`\n\tNFTs has been fetched successfully!`);

    writeFileSync(
        'hashlist.json',
        JSON.stringify(hashlist)
    );


    console.log(`\n\tSaved as hashlist.json!`);
    return hashlist;
}

export async function snapshotHashlist(
    hashlistPath: string,
    rpc: string
) {
    const hashlist: Array<string> = JSON.parse(readFileSync(hashlistPath, 'utf-8'));
    const connection = new Connection(rpc);
    const snapshot: { [address: string]: { amount: number, mints: Array<string> } } = {};
    //const metaplex = new Metaplex(connection);

    let total_amount = 0;
    let total_holders = 0;

    console.log(`\tStarting to fetch owners...`);

    for (const hash of hashlist) {
        const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(hash));
        const largestAccount = largestAccounts.value.reduce((prev, curr) => ((prev.uiAmount || 0) > (curr.uiAmount || 0)) ? prev : curr);
        // console.log(largestAccount.address.toBase58());
        // console.log(largestAccount.uiAmount);

        const parsedAccountInfo = await connection.getParsedAccountInfo(largestAccount.address);
        const ownerAddress: string = (parsedAccountInfo.value?.data as ParsedAccountData).parsed.info.owner;

        if (!Object.keys(snapshot).includes(ownerAddress)) {
            snapshot[ownerAddress] = {
                amount: 0,
                mints: []
            };
            total_holders++;
        }
        snapshot[ownerAddress].mints.push(hash);
        snapshot[ownerAddress].amount++;
        total_amount++;

        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`\tFetched ${total_amount} of ${hashlist.length}...`);

    }
    console.log(`\tOwners has been fetched successfully!\n\tTotal mints: ${total_amount}\n\tTotal holders: ${total_holders}`);

    writeFileSync(
        'gib-holders.json',
        JSON.stringify(snapshot)
    );

    console.log(`\tSaved as gib-holders.json!`);

    return snapshot;
}

export async function getMetadata(
    hashlistPath: string,
    rpc: string
) {

    const hashlist: Array<string> = JSON.parse(readFileSync(hashlistPath, 'utf-8'));
    const connection = new Connection(rpc);
    const metaplex = new Metaplex(connection);

    let total_amount = 0;

    const meta: Array<{
        tokenData: any,
        metadata: any,
        mint: string
    }> = [];

    console.log(`\tStarting to fetch metadata...`);

    for (const hash of hashlist) {
        const metadata = await metaplex.nfts().findByMint({
            mintAddress: new PublicKey(hash),
            loadJsonMetadata: true
        }).run()

        meta.push({
            tokenData: {
                name: metadata.name,
                symbol: metadata.symbol,
                uri: metadata.uri,
                sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
                creators: metadata.creators,

            },
            metadata: metadata.json,
            mint: metadata.address.toBase58()
        });

        if(metadata.json){
            meta[meta.length-1].metadata = (await (await fetch(metadata.uri)).json());
        }

        total_amount++;

        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`\tFetched ${total_amount} of ${hashlist.length}...`);
    }

    console.log(`\n\n\tMetadata has been fetched successfully!\n\tTotal metadata fetched: ${total_amount}\n\t`);

    writeFileSync(
        'gib-meta.json',
        JSON.stringify(meta)
    );
    
    console.log(`\tSaved as gib-meta.json!`);

    return meta;
}

export async function getMintersInformation(
    hashlistPath: string,
    rpc: string
) {

    const hashlist: Array<string> = JSON.parse(readFileSync(hashlistPath, 'utf-8'));
    const connection = new Connection(rpc);

    let total_amount = 0;
    let stringBuffer = `Token Address, Minter Address, Mint Price, Mint Date, Signature\n`;

    console.log(`\tStarting to fetch minters information...`);

    const isMintTransaction = (mintAddress: string, txResponse: TransactionResponse) => {
        return txResponse.transaction.message.accountKeys.map(aK => aK.toBase58()).includes(mintAddress)
    }

    const getMinter =  (txResponse: TransactionResponse) => {
        return txResponse.transaction.message.accountKeys[0];
    }

    const getMintPrice = (txResponse: TransactionResponse) => {
        if(txResponse.meta){
            return (txResponse.meta?.preBalances[0] - txResponse.meta?.postBalances[0]) / LAMPORTS_PER_SOL;
        } else {
            return null;
        } 
    }

    for (const hash of hashlist) {
        const transactionHistory = await connection.getSignaturesForAddress(
            new PublicKey(hash)
        );

        const mintTransaction = transactionHistory.filter(t => (t as any).confirmationStatus == "finalized").reduce((prevT, curT) => 
            ((prevT.blockTime || Date.now()) < (curT.blockTime || Date.now())) ? prevT : curT
        );

        const mintTransactionInfo = await connection.getTransaction(mintTransaction.signature);
        
        if(mintTransactionInfo && isMintTransaction(hash, mintTransactionInfo)){
            const mintPrice = getMintPrice(mintTransactionInfo);
            const minter = getMinter(mintTransactionInfo);
            const mint = new PublicKey(hash);
            const mintDate = mintTransactionInfo.blockTime ? new Date(mintTransactionInfo.blockTime * 1000).toUTCString() : "Check signature for date"; 
            const mintTxId = mintTransaction.signature;

            stringBuffer += `${mint.toBase58() },${minter.toBase58()},${mintPrice ? mintPrice : "CHECK SOLSCAN"},${mintDate.replace(",", "")},${mintTxId}\n`
        
            total_amount++;
            
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`\tFetched ${total_amount} of ${hashlist.length}...`);

            writeFileSync(
                'minters_information.csv',
                stringBuffer
            );
        }
    }

    console.log(`\n\n\tMinters information has been fetched successfully!\n\tTotal mint information fetched: ${total_amount}\n\t`);

    console.log(`\tSaved as minters_information.csv!`);
}