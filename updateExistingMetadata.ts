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
        console.log(result);
      } catch(err) {
        console.log(err);
      }
})();