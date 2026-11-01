import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  calculateCreate2Address,
  type Create2CalculationResult,
} from '../utils/create2';
import { CREATE2_SCAN_ABI } from '../contracts/contractConfig';
import {
  Calculator,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  Info,
  Hash,
  Binary,
  Fuel,
} from 'lucide-react';

interface AddressPredictionProps {
  contractAddress: string;
  onPredictionComputed: (result: Create2CalculationResult) => void;
  onRequestCreated: (requestId: string, txHash: string) => void;
}

// Preset examples for quick test and verification
const PRESET_EXAMPLES = [
  {
    name: 'Sample Factory & Contract',
    deployer: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    isSaltHex: true,
    bytecode:
      '0x608060405234801561001057600080fd5b506040516101203803806101208339818801604052602081101561003357600080fd5b810190808051906020019092919050505b600081111561008057600080fd5b5061008f565b600080fd5b',
    isBytecodeHash: false,
  },
  {
    name: 'Standard Text Salt & Direct Hash',
    deployer: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    salt: 'create2-salt-prod-v1',
    isSaltHex: false,
    bytecode: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
    isBytecodeHash: true,
  },
];

export const AddressPrediction: React.FC<AddressPredictionProps> = ({
  contractAddress,
  onPredictionComputed,
  onRequestCreated,
}) => {
  const { isConnected } = useAccount();

  const [deployer, setDeployer] = useState('0x1111111254EEB25477B68fb85Ed929f73A960582');
  const [saltInput, setSaltInput] = useState('0x0000000000000000000000000000000000000000000000000000000000000001');
  const [isSaltHex, setIsSaltHex] = useState(true);
  const [bytecodeInput, setBytecodeInput] = useState(
    '0x608060405234801561001057600080fd5b506040516101203803806101208339818801604052602081101561003357600080fd5b'
  );
  const [isBytecodeHash, setIsBytecodeHash] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Wagmi contract write for requesting prediction on-chain (Gas fee only)
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Calculate whenever inputs change
  const calculation = calculateCreate2Address({
    deployer,
    saltInput,
    isSaltHex,
    bytecodeInput,
    isBytecodeHash,
  });

  useEffect(() => {
    onPredictionComputed(calculation);
  }, [
    calculation.valid,
    calculation.predictedAddress,
    calculation.initCodeHash,
    calculation.normalizedSalt,
  ]);

  useEffect(() => {
    if (isConfirmed && receipt && hash) {
      // Find request ID from logs or fallback
      let requestId = 'Pending';
      try {
        if (receipt.logs && receipt.logs.length > 0) {
          // The first topic is event signature, second topic is indexed requestId
          const log = receipt.logs[0];
          if (log && log.topics && log.topics[1]) {
            requestId = BigInt(log.topics[1]).toString();
          }
        }
      } catch (e) {
        // Fallback
      }
      onRequestCreated(requestId, hash);
    }
  }, [isConfirmed, receipt, hash]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setDeployer(preset.deployer);
    setSaltInput(preset.salt);
    setIsSaltHex(preset.isSaltHex);
    setBytecodeInput(preset.bytecode);
    setIsBytecodeHash(preset.isBytecodeHash);
  };

  const handleRequestOnChain = () => {
    if (!contractAddress || !calculation.valid || !calculation.deployer) return;

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CREATE2_SCAN_ABI,
      functionName: 'requestPrediction',
      args: [
        calculation.deployer,
        calculation.normalizedSalt!,
        calculation.initCodeHash!,
      ],
    });
  };

  return (
    <div className="panel-card p-6 border-[#27272a] shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">1. Address Prediction</h2>
            <p className="text-xs text-zinc-400">
              Compute deterministic EVM CREATE2 addresses instantly with live bytecode hashing
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 hidden sm:inline">Presets:</span>
          {PRESET_EXAMPLES.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-xs px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white transition-colors"
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Input Form */}
        <div className="space-y-4">
          {/* Deployer Address */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Factory / Deployer Address
            </label>
            <input
              type="text"
              value={deployer}
              onChange={(e) => setDeployer(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 text-xs mono-font input-field"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              The address that will invoke the CREATE2 opcode.
            </p>
          </div>

          {/* Salt Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Salt (bytes32)</label>
              <div className="flex items-center text-xs bg-[#18181b] p-0.5 rounded border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsSaltHex(true)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    isSaltHex
                      ? 'bg-[#27272a] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hex (0x...)
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaltHex(false)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    !isSaltHex
                      ? 'bg-[#27272a] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  String Seed
                </button>
              </div>
            </div>
            <input
              type="text"
              value={saltInput}
              onChange={(e) => setSaltInput(e.target.value)}
              placeholder={isSaltHex ? '0x00... or raw 32-byte hex' : 'e.g. my-app-v1'}
              className="w-full px-3 py-2 text-xs mono-font input-field"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              {isSaltHex
                ? '32-byte hexadecimal salt (automatically padded if shorter).'
                : 'Seed string converted via keccak256.'}
            </p>
          </div>

          {/* Initialization Bytecode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Initialization Bytecode / Hash
              </label>
              <div className="flex items-center text-xs bg-[#18181b] p-0.5 rounded border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsBytecodeHash(false)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    !isBytecodeHash
                      ? 'bg-[#27272a] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Raw Bytecode
                </button>
                <button
                  type="button"
                  onClick={() => setIsBytecodeHash(true)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    isBytecodeHash
                      ? 'bg-[#27272a] text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Direct Hash (32B)
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={bytecodeInput}
              onChange={(e) => setBytecodeInput(e.target.value)}
              placeholder={
                isBytecodeHash
                  ? '0x... (64 hex characters / 32 bytes)'
                  : '0x... (contract creation bytecode including constructor args)'
              }
              className="w-full px-3 py-2 text-xs mono-font input-field resize-none"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              {isBytecodeHash
                ? 'Direct 32-byte hash: keccak256(initCode).'
                : 'Full deployment creation code (keccak256 computed on the fly).'}
            </p>
          </div>
        </div>

        {/* Right column: Calculated Output & On-Chain Action */}
        <div className="flex flex-col justify-between p-4 rounded-lg bg-[#151518] border border-[#27272a]">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Calculation Output
              </span>
              {calculation.valid ? (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-medium">
                  Valid CREATE2 Params
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                  Input Error
                </span>
              )}
            </div>

            {calculation.valid ? (
              <div className="space-y-3.5">
                {/* Predicted Contract Address */}
                <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-zinc-400">
                      Predicted Contract Address
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(calculation.predictedAddress!, 'addr')
                      }
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Copy address"
                    >
                      {copiedKey === 'addr' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="text-sm font-semibold mono-font text-white break-all">
                    {calculation.predictedAddress}
                  </div>
                </div>

                {/* Normalized Salt */}
                <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-zinc-400">Normalized Salt (bytes32)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(calculation.normalizedSalt!, 'salt')}
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Copy salt"
                    >
                      {copiedKey === 'salt' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] mono-font text-zinc-300 break-all">
                    {calculation.normalizedSalt}
                  </p>
                </div>

                {/* Init Code Hash */}
                <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-zinc-400">
                      Init Code Hash (keccak256)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(calculation.initCodeHash!, 'hash')
                      }
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="Copy bytecode hash"
                    >
                      {copiedKey === 'hash' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] mono-font text-zinc-300 break-all">
                    {calculation.initCodeHash}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 text-xs">
                <div className="flex items-center gap-2 text-amber-300 mb-1">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Calculation Notice</span>
                </div>
                <p>{calculation.error || 'Please fill in all inputs with valid data.'}</p>
              </div>
            )}
          </div>

          {/* On-chain registration */}
          <div className="mt-5 pt-4 border-t border-[#27272a]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-zinc-400" />
                Interactions: <strong className="text-zinc-200">Gas fee only</strong>
              </span>
              <span className="text-[11px] text-zinc-500">Zero protocol fees</span>
            </div>

            <button
              type="button"
              disabled={
                !calculation.valid ||
                !isConnected ||
                !contractAddress ||
                isWritePending ||
                isConfirming
              }
              onClick={handleRequestOnChain}
              className="w-full py-2.5 px-4 btn-primary flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              {isWritePending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                  <span>
                    {isWritePending ? 'Waiting for signature...' : 'Confirming on Botchain...'}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Inspection on Botchain (Gas Only)</span>
                </>
              )}
            </button>

            {!isConnected && (
              <p className="text-[11px] text-zinc-500 text-center mt-2">
                Connect your wallet to record this prediction on-chain.
              </p>
            )}

            {!contractAddress && isConnected && (
              <p className="text-[11px] text-amber-400/80 text-center mt-2">
                Create2Scan contract not deployed yet. Calculation is still available above!
              </p>
            )}

            {writeError && (
              <p className="text-[11px] text-rose-400 mt-2 bg-rose-950/30 p-2 rounded border border-rose-900/50 break-all">
                {writeError.message.slice(0, 140)}...
              </p>
            )}

            {isConfirmed && hash && (
              <div className="text-[11px] text-emerald-300 mt-2 bg-emerald-950/30 p-2 rounded border border-emerald-900/50 flex items-center justify-between">
                <span>Inspection recorded on Botchain!</span>
                <a
                  href={`https://scan.bohr.life/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-emerald-200 hover:text-white"
                >
                  View Tx
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

