import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bs58 from "bs58";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const MUSDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_MUSDC_MINT!);
const MINT_AUTHORITY = Keypair.fromSecretKey(bs58.decode(process.env.MINT_AUTHORITY_KEYPAIR!));

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(walletAddress);
    } catch (e) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    // Check cooldown in Convex
    const lastClaim = await convex.query(api.faucet.getLastClaim, { wallet: walletAddress });
    if (lastClaim) {
      const dayInMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (now - lastClaim.claimedAt < dayInMs) {
        return NextResponse.json({ 
          error: "cooldown", 
          nextClaim: lastClaim.claimedAt + dayInMs 
        }, { status: 429 });
      }
    }

    // Get or create ATA for user
    const userATA = await getOrCreateAssociatedTokenAccount(
      connection,
      MINT_AUTHORITY,
      MUSDC_MINT,
      userPubkey
    );

    // Get Mint Authority's ATA (where we keep the faucet supply)
    const mintAuthorityATA = await getOrCreateAssociatedTokenAccount(
      connection,
      MINT_AUTHORITY,
      MUSDC_MINT,
      MINT_AUTHORITY.publicKey
    );

    const amount = 1000 * 10 ** 6; // 1,000 mUSDC

    // Build Transfer Instruction
    const transferIx = createTransferInstruction(
      mintAuthorityATA.address,
      userATA.address,
      MINT_AUTHORITY.publicKey,
      amount
    );

    const tx = new Transaction().add(transferIx);
    const signature = await connection.sendTransaction(tx, [MINT_AUTHORITY]);
    await connection.confirmTransaction(signature);

    // Record in Convex
    await convex.mutation(api.faucet.recordClaim, {
      wallet: walletAddress,
      amount: 1000,
      txSignature: signature
    });

    return NextResponse.json({ success: true, txSignature: signature, amount: 1000 });

  } catch (error: any) {
    console.error("Faucet Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
