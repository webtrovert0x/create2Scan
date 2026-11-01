import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { CREATE2_SCAN_ABI } from '../contracts/contractConfig';
import { botchainPublicClient, checkAddressDeployment } from '../utils/create2';
import {
  FileText,
  Search,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Send,
  Loader2,
  ShieldCheck,
  Fuel,
} from 'lucide-react';
import type { Address, Hex } from 'viem';

interface RequestDetailsProps {
  contractAddress: string;
  selectedRequestId: string;
  recentTxHash?: string;
  onRequestPublished: () => void;
}

interface RequestData {
  id: bigint;
  requester: Address;
  deployer: Address;
  salt: Hex;
  initCodeHash: Hex;
  predictedAddress: Address;
  isDeployed: boolean;
  completed: boolean;
  timestamp: bigint;
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({
  contractAddress,
  selectedRequestId,
  recentTxHash,
  onRequestPublished,
}) => {
  const { isConnected } = useAccount();
  const [searchId, setSearchId] = useState(selectedRequestId || '1');
  const [data, setData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Wagmi contract write for publishResult (Gas fee only)
  const {
    data: publishHash,
    isPending: isPublishing,
    writeContract: publishResultWrite,
    error: publishError,
  } = useWriteContract();

  const { isSuccess: isPublishConfirmed } = useWaitForTransactionReceipt({
    hash: publishHash,
  });

  const loadRequest = async (idToQuery: string) => {
    if (!contractAddress || !idToQuery || !/^\d+$/.test(idToQuery)) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = (await botchainPublicClient.readContract({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'getRequest',
        args: [BigInt(idToQuery)],
      })) as RequestData;

      setData(res);
    } catch (err: any) {
      setData(null);
      setError(
        err?.message?.includes('Request does not exist')
          ? `Request ID #${idToQuery} does not exist on Botchain Testnet yet.`
          : 'Failed to retrieve request details from contract.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      setSearchId(selectedRequestId);
      loadRequest(selectedRequestId);
    }
  }, [selectedRequestId]);

  useEffect(() => {
    if (isPublishConfirmed) {
      onRequestPublished();
      loadRequest(searchId);
    }
  }, [isPublishConfirmed]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePublishNow = async () => {
    if (!contractAddress || !data) return;

    try {
      // 1. Calculate deterministic address
      const predicted = (await botchainPublicClient.readContract({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'computeAddress',
        args: [data.deployer, data.salt, data.initCodeHash],
      })) as Address;

      // 2. Check bytecode state on Botchain
      const checkRes = await checkAddressDeployment(predicted);

      // 3. Submit transaction (Gas fee only)
      publishResultWrite({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'publishResult',
        args: [data.id, predicted, checkRes.isDeployed],
      });
    } catch (err: any) {
      console.error('Publish error:', err);
    }
  };

  return (
    <div className="panel-card p-6 border-[#27272a] shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              4. Request Transaction Details
            </h2>
            <p className="text-xs text-zinc-400">
              Inspect on-chain proof, caller verification, salt parameters, and settlement status
            </p>
          </div>
        </div>

        {/* Search by Request ID */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Request ID #"
              className="w-32 px-2.5 py-1.5 text-xs mono-font input-field"
            />
          </div>
          <button
            type="button"
            onClick={() => loadRequest(searchId)}
            disabled={loading || !searchId}
            className="px-3 py-1.5 text-xs btn-primary font-medium"
          >
            Load
          </button>
        </div>
      </div>

      {recentTxHash && (
        <div className="mb-4 p-3 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Latest Submitted Transaction:</span>
            <span className="mono-font text-zinc-400">
              {recentTxHash.slice(0, 10)}...{recentTxHash.slice(-8)}
            </span>
          </div>
          <a
            href={`https://scan.bohr.life/tx/${recentTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-emerald-300 hover:text-white"
          >
            <span>BohrScan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span>Fetching request #{searchId} from Botchain...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-[#27272a] text-zinc-400 text-xs text-center">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="p-4 rounded-lg bg-[#151518] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold mono-font px-2.5 py-1 rounded bg-[#222226] text-white border border-[#3f3f46]">
                Request #{data.id.toString()}
              </span>

              {data.completed ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Published & Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Pending Result Publication</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {new Date(Number(data.timestamp) * 1000).toLocaleString()} (Block time)
              </span>
            </div>
          </div>

          {/* Core Parameters Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requester */}
            <div className="p-3.5 rounded-lg bg-[#141416] border border-[#27272a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Requester Address</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.requester, 'req')}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === 'req' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="mono-font text-xs text-zinc-200 break-all">{data.requester}</p>
            </div>

            {/* Deployer */}
            <div className="p-3.5 rounded-lg bg-[#141416] border border-[#27272a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Factory / Deployer Address</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.deployer, 'dep')}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === 'dep' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="mono-font text-xs text-zinc-200 break-all">{data.deployer}</p>
            </div>

            {/* Salt */}
            <div className="p-3.5 rounded-lg bg-[#141416] border border-[#27272a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">CREATE2 Salt (bytes32)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.salt, 'salt')}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === 'salt' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="mono-font text-xs text-zinc-200 break-all">{data.salt}</p>
            </div>

            {/* Init Code Hash */}
            <div className="p-3.5 rounded-lg bg-[#141416] border border-[#27272a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Init Code Hash (keccak256)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.initCodeHash, 'codeHash')}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === 'codeHash' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="mono-font text-xs text-zinc-200 break-all">{data.initCodeHash}</p>
            </div>
          </div>

          {/* Settled Result or Action Box */}
          {data.completed ? (
            <div className="p-4 rounded-lg bg-[#161917] border border-emerald-900/50 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
                On-Chain Verification Result
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-zinc-400 block">
                    Calculated Contract Address:
                  </span>
                  <span className="mono-font text-sm text-white font-medium break-all">
                    {data.predictedAddress}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {data.isDeployed ? (
                    <span className="text-xs px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-medium">
                      Bytecode Exists (Collision Detected)
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                      Empty Address (Clean & Deployable)
                    </span>
                  )}

                  <a
                    href={`https://scan.bohr.life/address/${data.predictedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white transition-colors"
                    title="View on BohrScan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#181614] border border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-amber-300 block mb-0.5">
                  Action Required: Publish Result
                </span>
                <p className="text-[11px] text-zinc-400">
                  Compute and finalize this prediction on the Botchain contract (gas fee only).
                </p>
              </div>

              <button
                type="button"
                disabled={isPublishing || !isConnected}
                onClick={handlePublishNow}
                className="px-4 py-2 text-xs btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Result (Gas Fee Only)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-[#27272a] rounded-lg">
          <p>Select a request from Prediction History (Section 3) or enter a Request ID above to view details.</p>
        </div>
      )}
    </div>
  );
};

