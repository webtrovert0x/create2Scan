import React from 'react';
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { botchainTestnet } from '../config/chains';
import { ShieldCheck, ExternalLink, Wallet, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface HeaderProps {
  contractAddress: string;
}

export const Header: React.FC<HeaderProps> = ({ contractAddress }) => {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { switchChain } = useSwitchChain();

  const { data: balanceData } = useBalance({
    address,
    chainId: botchainTestnet.id,
  });

  const isWrongNetwork = isConnected && chain?.id !== botchainTestnet.id;

  return (
    <header className="border-b border-[#27272a] bg-[#0c0c0e]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-200">
            <Layers className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">Create2Scan</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#27272a] text-zinc-300 border border-[#3f3f46]">
                EVM Inspector
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Deterministic Contract Address Predictor & Collision Scanner
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Botchain Testnet Network Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300 font-medium">Botchain Testnet</span>
            <span className="text-zinc-500">ID: 968</span>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition-colors ml-1"
              title="Open BohrScan Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Contract Address Status Badge */}
          {contractAddress ? (
            <a
              href={`https://scan.bohr.life/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-300 hover:border-[#3f3f46] transition-colors"
              title="Verified Create2Scan on-chain contract"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Contract:</span>
              <span className="mono-font text-zinc-400">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </span>
            </a>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-amber-900/40 text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Contract not set</span>
            </div>
          )}

          {/* Network Switcher if on wrong network */}
          {isWrongNetwork && (
            <button
              onClick={() => switchChain({ chainId: botchainTestnet.id })}
              className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-200 text-xs font-medium hover:bg-amber-900 transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Switch to Botchain (968)
            </button>
          )}

          {/* Connect / Wallet Button */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#27272a] border border-[#27272a] text-xs font-mono text-zinc-200 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </span>
                {balanceData && (
                  <span className="text-zinc-400 font-sans border-l border-[#3f3f46] pl-2">
                    {parseFloat(balanceData.formatted).toFixed(3)} BOT
                  </span>
                )}
              </button>
              <button
                onClick={() => disconnect()}
                className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium border border-[#3f3f46] transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

