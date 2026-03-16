import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const pubkey = new PublicKey(address);

    console.log(`[FAUCET] Requesting airdrop for ${address}...`);
    const signature = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);

    return Response.json({ success: true, txHash: signature });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
