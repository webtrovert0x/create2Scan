import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainTestnet } from './chains';
import { REOWN_ID } from './env';

// Project ID from REOWN_ID in .env
export const projectId = REOWN_ID || 'c4f79cc821944d9680842e34466bfbd';

// Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [botchainTestnet],
  projectId,
  ssr: false,
});

export const config = wagmiAdapter.wagmiConfig;

// Initialize Reown AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet],
  defaultNetwork: botchainTestnet,
  projectId,
  metadata: {
    name: 'Create2Scan',
    description: 'Deterministic EVM CREATE2 Address Calculator & Inspector on Botchain Testnet',
    url: 'https://scan.bohr.life',
    icons: ['https://scan.bohr.life/images/logo.png'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3f3f46',
    '--w3m-color-mix': '#121212',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '6px',
  },
});

