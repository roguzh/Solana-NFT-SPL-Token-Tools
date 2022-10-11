import { findMetadataPda } from "@metaplex-foundation/js";
import { createCreateMetadataAccountV2Instruction, createUpdateMetadataAccountInstruction, createUpdateMetadataAccountV2Instruction, DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import base58 from "bs58";
import { CONFIG } from "./env";

(async() => {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const keypair = Keypair.fromSecretKey(
        base58.decode(CONFIG.PRIVATEKEY)
    );
    const metadataPDA = await findMetadataPda(new PublicKey(CONFIG.TOKEN_ADDRESS));

    const tokenMetadata = {
      name: CONFIG.TOKEN_NAME, 
      symbol: CONFIG.TOKEN_SYMBOL,
      uri: CONFIG.TOKEN_URI,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null
    } as DataV2;

    const transaction = new Transaction().add(
        createCreateMetadataAccountV2Instruction({
            metadata: metadataPDA,
            mint: new PublicKey(CONFIG.TOKEN_ADDRESS),
            mintAuthority: keypair.publicKey,
            payer: keypair.publicKey,
            updateAuthority: keypair.publicKey,
          },
          { createMetadataAccountArgsV2: 
            { 
              data: tokenMetadata, 
              isMutable: true 
            } 
          }
        )
      );

      try {
        const result = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log(result);
      } catch(err) {
        console.log(err);
      }
})();