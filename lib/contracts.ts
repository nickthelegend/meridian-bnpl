import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('MERID11111111111111111111111111111111111111'); // Placeholder
export const USDC_MINT = new PublicKey('4zMMC9srtvSqzRLUX2oqqzbcyRgp9nEJ97zJJ2r4qaEP'); // Devnet USDC

export const NETWORKS = {
    DEVNET: {
        id: 'devnet',
        name: 'Solana Devnet',
        rpc: 'https://api.devnet.solana.com',
    },
    MAINNET: {
        id: 'mainnet-beta',
        name: 'Solana Mainnet',
        rpc: 'https://api.mainnet-beta.solana.com',
    }
};

export const CONTRACTS = {
    VAULT_PROGRAM: PROGRAM_ID,
    USDC: USDC_MINT,
};
