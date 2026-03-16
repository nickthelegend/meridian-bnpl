import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Real Deployed Program IDs (Solana Devnet)
export const PROGRAM_IDS = {
  collateralVault: new PublicKey("BE8LMagbTc3Rcy6UV6NDyCSfSSygZ5k9fB1v4WPBmfwb"),
  creditEngine: new PublicKey("3vERhcczWPCJLhw6RygnbJAwzFKywbFwwB2efnXefAPE"),
  bnplCheckout: new PublicKey("7SDq9q5JrKZGHvaz5dcgHpzAFy5LP583BGHJuyExHPnX"),
  repaymentTracker: new PublicKey("4fkfzDbGdpyRtAByZWQ4xskB6AKfpHtFwy8mTTNx7V1G"),
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
