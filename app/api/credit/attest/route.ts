import { Connection, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.json();
    
    // In Solana, we verify signatures using tweetnacl
    const verified = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        Buffer.from(signature, 'hex'),
        Buffer.from(address, 'hex') // In a real app, this would be the publicKey bytes
    );

    return Response.json({ success: true, verified });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
