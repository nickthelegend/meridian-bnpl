import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Placeholder IDs for the client
export const PROGRAM_IDS = {
  collateralVault: new PublicKey("CoLLatEraLVauLt1111111111111111111111111111"),
  creditEngine: new PublicKey("CreDitEnGinE111111111111111111111111111111"),
  bnplCheckout: new PublicKey("BnPlCheCkout11111111111111111111111111111"),
  repaymentTracker: new PublicKey("RepayMenTTraCker1111111111111111111111111"),
};

export class MeridianClient {
  provider: AnchorProvider;

  constructor(connection: Connection, wallet: any) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }

  async depositCollateral(amount: number, lockDuration: number) {
    console.log(`[Client] Depositing ${amount} USDC for ${lockDuration}s`);
    const txHash = "simulated_tx_hash_" + Math.random().toString(36).slice(2);
    
    // Wire Convex
    await convex.mutation(api.vaults.createVault, {
        userWallet: this.provider.wallet.publicKey.toBase58(),
        amount: amount
    });
    
    return txHash;
  }

  async initiateCheckout(totalAmount: number, merchantPubkey: PublicKey, orderId: string) {
    console.log(`[Client] Initiating BNPL for ${totalAmount} USDC`);
    const txHash = "simulated_tx_hash_" + Math.random().toString(36).slice(2);

    // Wire Convex
    await convex.mutation(api.orders.createOrder, {
        orderId,
        userWallet: this.provider.wallet.publicKey.toBase58(),
        merchantWallet: merchantPubkey.toBase58(),
        totalAmount,
        installmentAmount: totalAmount / 3,
    });

    await convex.mutation(api.merchants.updateGMV, {
        merchantWallet: merchantPubkey.toBase58(),
        amount: totalAmount
    });

    return txHash;
  }

  async payInstallment(orderId: string, index: number) {
    const txHash = "simulated_tx_hash_" + Math.random().toString(36).slice(2);
    
    // Wire Convex
    await convex.mutation(api.orders.updateInstallment, {
        orderId,
        index,
        txSignature: txHash
    });

    return txHash;
  }

  async withdrawCollateral() {
    const userWallet = this.provider.wallet.publicKey.toBase58();
    
    // Wire Convex
    await convex.mutation(api.vaults.unlockVault, { userWallet });
    
    return "simulated_tx_hash";
  }

  async getVaultState() {
    return { balance: 1000, yield: 84.2, locked: true };
  }
}
