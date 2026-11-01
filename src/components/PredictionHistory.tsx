import React, { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { CREATE2_SCAN_ABI } from '../contracts/contractConfig';
import { botchainPublicClient, checkAddressDeployment } from '../utils/create2';
import {
  History,
  RefreshCw,
  ExternalLink,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Fuel,
} from 'lucide-react';
import type { Address } from 'viem';

interface PredictionHistoryProps {
  contractAddress: string;
  onSelectRequest: (requestId: string) => void;
  refreshTrigger: number;
}

interface StoredRequest {
  id: bigint;
  requester: Address;
  deployer: Address;
  salt: `0x${string}`;
  initCodeHash: `0x${string}`;
  predictedAddress: Address;
  isDeployed: boolean;
  completed: boolean;
  timestamp: bigint;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  contractAddress,
  onSelectRequest,
  refreshTrigger,
}) => {
  const { address } = useAccount();
  const [filterMine, setFilterMine] = useState(false);
  const [requestsList, setRequestsList] = useState<StoredRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Wagmi contract write for publishResult (Gas fee only)
  const {
    data: publishTxHash,
    isPending: isPublishPending,
    writeContract: writePublishResult,
    error: publishError,
  } = useWriteContract();

  const { isSuccess: isPublishSuccess } = useWaitForTransactionReceipt({
    hash: publishTxHash,
  });

  const fetchRequests = async () => {
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Read requestNonce
      const nonce = (await botchainPublicClient.readContract({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'requestNonce',
      })) as bigint;

      const total = Number(nonce);
      if (total === 0) {
        setRequestsList([]);
        setIsLoading(false);
        return;
      }

      // Fetch recent requests (up to 25)
      const count = Math.min(total, 25);
      const promises: Promise<any>[] = [];

      for (let i = 0; i < count; i++) {
        const id = BigInt(total - i);
        promises.push(
          botchainPublicClient.readContract({
            address: contractAddress as Address,
            abi: CREATE2_SCAN_ABI,
            functionName: 'getRequest',
            args: [id],
          })
        );
      }

      const results = await Promise.all(promises);
      setRequestsList(results as StoredRequest[]);
    } catch (err) {
      console.error('Error fetching prediction history from Botchain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [contractAddress, refreshTrigger, isPublishSuccess]);

  const handlePublishResult = async (req: StoredRequest) => {
    if (!contractAddress) return;
    setPublishingId(req.id.toString());

    try {
      // 1. Compute address using on-chain helper or pure client
      const predicted = (await botchainPublicClient.readContract({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'computeAddress',
        args: [req.deployer, req.salt, req.initCodeHash],
      })) as Address;

      // 2. Query code state on Botchain RPC
      const checkRes = await checkAddressDeployment(predicted);

      // 3. Write result on-chain (Gas fee only)
      writePublishResult({
        address: contractAddress as Address,
        abi: CREATE2_SCAN_ABI,
        functionName: 'publishResult',
        args: [req.id, predicted, checkRes.isDeployed],
      });
    } catch (err) {
      console.error('Error publishing prediction result:', err);
      setPublishingId(null);
    }
  };

  const filteredRequests = filterMine && address
    ? requestsList.filter(
        (r) => r.requester.toLowerCase() === address.toLowerCase()
      )
    : requestsList;

  return (
    <div className="panel-card p-6 border-[#27272a] shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">3. Prediction History</h2>
            <p className="text-xs text-zinc-400">
              On-chain log of inspection requests recorded in Create2Scan on Botchain Testnet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {address && (
            <button
              type="button"
              onClick={() => setFilterMine(!filterMine)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                filterMine
                  ? 'bg-[#27272a] border-[#3f3f46] text-white'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-white'
              }`}
            >
              {filterMine ? 'Showing: My Requests' : 'Filter: My Requests'}
            </button>
          )}

          <button
            type="button"
            onClick={fetchRequests}
            disabled={isLoading || !contractAddress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 transition-colors disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!contractAddress ? (
        <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-[#27272a] rounded-lg">
          <p>Please deploy or configure the Create2Scan contract to view on-chain request history.</p>
        </div>
      ) : isLoading && requestsList.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span>Reading requests from Botchain Testnet...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-[#27272a] rounded-lg">
          <p>No prediction requests found yet. Submit one in Section 1 to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const reqIdStr = req.id.toString();
            const isMine =
              address && req.requester.toLowerCase() === address.toLowerCase();

            return (
              <div
                key={reqIdStr}
                className="p-4 rounded-lg bg-[#151518] border border-[#27272a] hover:border-[#3f3f46] transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mono-font font-bold text-xs px-2 py-0.5 rounded bg-[#1f1f23] text-zinc-300 border border-[#27272a]">
                      #{reqIdStr}
                    </span>

                    {req.completed ? (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                        <Clock className="w-3 h-3" />
                        Pending Verification
                      </span>
                    )}

                    {isMine && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#27272a] text-zinc-300 border border-[#3f3f46]">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {new Date(Number(req.timestamp) * 1000).toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectRequest(reqIdStr)}
                      className="text-xs text-zinc-300 hover:text-white underline"
                    >
                      Inspect in Section 4
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-[#18181b] border border-[#27272a]/60 flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Deployer:</span>
                    <span className="mono-font text-zinc-300">
                      {req.deployer.slice(0, 8)}...{req.deployer.slice(-6)}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-[#18181b] border border-[#27272a]/60 flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Requester:</span>
                    <span className="mono-font text-zinc-300">
                      {req.requester.slice(0, 8)}...{req.requester.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Published Result Details (If completed) */}
                {req.completed ? (
                  <div className="p-2.5 rounded bg-[#121214] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">
                        Resolved Contract Address:
                      </span>
                      <span className="mono-font text-white font-medium break-all">
                        {req.predictedAddress}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.isDeployed ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-mono">
                          Bytecode Exists (Collision)
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono">
                          Empty (Safe to Deploy)
                        </span>
                      )}

                      <a
                        href={`https://scan.bohr.life/address/${req.predictedAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-[#27272a]"
                        title="View on BohrScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Action to settle/publish result */
                  <div className="p-2.5 rounded bg-[#171412] border border-amber-900/40 flex items-center justify-between text-xs">
                    <div className="text-amber-200/80 text-[11px]">
                      Awaiting settlement on Botchain. Anyone can publish the computed address.
                    </div>
                    <button
                      type="button"
                      disabled={isPublishPending && publishingId === reqIdStr}
                      onClick={() => handlePublishResult(req)}
                      className="px-2.5 py-1 text-xs btn-primary flex items-center gap-1.5"
                    >
                      {isPublishPending && publishingId === reqIdStr ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Publish Result (Gas Only)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

