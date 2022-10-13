import { Metaplex, walletAdapterIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { BASE_FOLDER } from "./tools";

export async function uploadSPLTokenMetadata(splTokenMetadataFileName: string, keypair: Keypair, rpc: string){
    try {
        const connection = new Connection(rpc);
        const metaplex = new Metaplex(connection);
        console.log(`\tUsing wallet address: ${keypair.publicKey.toString()}\t`);
    
        let bundlrProvider = 'https://devnet.bundlr.network';
    
        if(rpc !== 'devnet' && rpc !== 'https://api.devnet.solana.com'){
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

    } catch(err) {
        console.log(err);
        return null
    }
}

export async function uploadFile(filePath: string, keypair: Keypair, rpc: string){
    try {
        const connection = new Connection(rpc);
        const metaplex = new Metaplex(connection);
        console.log(`\tUsing wallet address: ${keypair.publicKey.toString()}\n`);
    
        let bundlrProvider = 'https://devnet.bundlr.network';
    
        if(rpc !== 'devnet' && rpc !== 'https://api.devnet.solana.com'){
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

    } catch(err) {
        console.log(err);
        return null
    }
    
}