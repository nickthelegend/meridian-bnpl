'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

export function ConnectWalletButton() {
  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-xl !h-10 !font-bold !text-xs !px-4" />
    </div>
  );
}
