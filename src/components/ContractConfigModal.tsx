import React, { useState } from 'react';
import { Settings, Check, Terminal, ExternalLink, X, ShieldAlert } from 'lucide-react';

interface ContractConfigModalProps {
  currentAddress: string;
  onSaveAddress: (newAddr: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractConfigModal: React.FC<ContractConfigModalProps> = ({
  currentAddress,
  onSaveAddress,
  isOpen,
  onClose,
}) => {
  const [addrInput, setAddrInput] = useState(currentAddress);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveAddress(addrInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="panel-card w-full max-w-lg p-6 border-[#3f3f46] shadow-2xl relative bg-[#121214]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md hover:bg-[#27272a]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-[#1e1e24] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Create2Scan Contract Configuration</h3>
            <p className="text-xs text-zinc-400">Botchain Testnet (Chain ID: 968)</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              Active Create2Scan Contract Address
            </label>
            <input
              type="text"
              value={addrInput}
              onChange={(e) => setAddrInput(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 mono-font input-field text-xs"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              You can set the deployed contract address here or in the <code>.env</code> file.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span>How to deploy via CLI:</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              1. Add your private key to <code>.env</code>:
            </p>
            <code className="block p-2 rounded bg-black/60 text-zinc-300 mono-font text-[11px] border border-[#27272a]">
              PRIVATE_KEY=0x...
            </code>
            <p className="text-[11px] text-zinc-400">
              2. Run the deployment command in terminal:
            </p>
            <code className="block p-2 rounded bg-black/60 text-zinc-300 mono-font text-[11px] border border-[#27272a]">
              npm run deploy
            </code>
            <p className="text-[11px] text-zinc-400">
              It will compile <code>contracts/Create2Scan.sol</code> and deploy it to Botchain Testnet automatically using your account.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md btn-primary text-xs font-medium flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

