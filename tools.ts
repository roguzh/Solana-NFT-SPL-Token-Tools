import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import { uploadSPLTokenMetadata } from "./upload";
import { existsSync, readFileSync } from 'fs';

export const BASE_FOLDER = "assets/";

const isValidHttpUrl = (urlString: string) => {
  let url = null;

  try {
    url = new URL(urlString);
  } catch (err) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export async function verifyOrUploadSPLTokenMetadata(uri: string, keypair: Keypair, rpc: string) {
  if (isValidHttpUrl(uri)) return uri;

  try {
    const res = await uploadSPLTokenMetadata(uri, keypair, rpc);

    if (!res) return null;

    console.log(`\tMetadata URI: ${res.uri}\n\tPlease use above URI next time to avoid re-uploading!`);

    return res.uri;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export function getValidationInput(question: string) {
  const prompt = require("prompt-sync")({ sigint: true });
  const res = prompt(question + ' (y/n)' );
  return res === 'y';
}

export function verifyMetadataOption(
  metadataURI: string | null,
  uploadMetadataPath: string | null
){
  if (!metadataURI && !uploadMetadataPath) {
    console.log(`\n\tOne of the options should be specified: --upload-metadata / --metadata-uri`);
  }
  else if (typeof metadataURI === typeof uploadMetadataPath) {
    console.log(`\n\tPlease give specify one of the options: --upload-metadata / --metadata-uri`);
  }
  else if(metadataURI){ 
    return metadataURI;
  }
  else if(uploadMetadataPath && existsSync(BASE_FOLDER + uploadMetadataPath)){
    return uploadMetadataPath;
  } else {
    console.log(`\n\tSpecified metadata file is not found. Please make sure to place it inside "assets/" folder.`);
  }
  process.exit(-1);
}

export function getKeypair(
  privateKey: string | null,
  keypairPath: string | null
): Keypair {
  if (!privateKey && !keypairPath) {
      console.log(`\n\tOne of the options should be specified: --private-key / --keypair`);
  }
  else if (typeof privateKey === typeof keypairPath) {
      console.log(`\n\tPlease give specify one of the options: --private-key / --keypair`);
  }
  else if (privateKey) {
      try {
          const keypair = Keypair.fromSecretKey(base58.decode(privateKey));
          const isConfirmed = getValidationInput(`\tGiven address: ${keypair.publicKey.toBase58()}. Do you confirm?`);
          if(isConfirmed) {
              return keypair;
          } else {
              console.log(`\n\tProcess has been cancelled!`);
              process.exit(-1);
          };
      }
      catch (err) {
          console.log(`\n\tInvalid private Key: ${privateKey}`);
          process.exit(-1);
      }
  }
  else if (keypairPath) {
      if (!existsSync(keypairPath)) {
          console.log(`\n\tInvalid keypair path: ${keypairPath}`);
      } else {
          try {
              const keypair = Keypair.fromSecretKey(
                  JSON.parse(
                      readFileSync(keypairPath, 'utf-8')
                  )
              );
              const isConfirmed = getValidationInput(`\tGiven address: ${keypair.publicKey.toBase58()}. Do you confirm?`);
              if(isConfirmed) {
                  return keypair;
              } else {
                  console.log(`\n\tProcess has been cancelled!`);
                  process.exit(-1);
              };
          }
          catch (err) {
              console.log(`\n\tKeypair wallet is not valid: ${keypairPath}`);
              process.exit(-1);
          }
      }
  }

  process.exit(-1);
}
