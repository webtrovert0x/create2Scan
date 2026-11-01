import React, { useState, useEffect } from 'react';
import {
  checkAddressDeployment,
  type DeploymentCheckResult,
} from '../utils/create2';
import {
  Search,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  RefreshCw,
  FileCode,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import type { Address } from 'viem';

interface DeploymentCheckProps {
  predictedAddress?: Address;
}

export const DeploymentCheck: React.FC<DeploymentCheckProps> = ({
  predictedAddress,
}) => {
  const [inspectAddress, setInspectAddress] = useState<string>('');
  const [status, setStatus] = useState<DeploymentCheckResult>({
    checked: false,
    loading: false,
    isDeployed: false,
    codeLength: 0,
  });

  // Automatically update input and trigger check when predictedAddress changes
  useEffect(() => {
    if (predictedAddress) {
      setInspectAddress(predictedAddress);
      runCheck(predictedAddress);
    }
  }, [predictedAddress]);

  const runCheck = async (addrToCheck?: string) => {
    const target = (addrToCheck || inspectAddress).trim() as Address;
    if (!target || !/^0x[a-fA-F0-9]{40}$/.test(target)) {
      setStatus({
        checked: true,
        loading: false,
        isDeployed: false,
        codeLength: 0,
        error: 'Please provide a valid 20-byte EVM address (0x...)',
      });
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: undefined }));
    const res = await checkAddressDeployment(target);
    setStatus(res);
  };

  return (
    <div className="panel-card p-6 border-[#27272a] shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">2. Existing Deployment Check</h2>
            <p className="text-xs text-zinc-400">
              Query Botchain Testnet RPC to verify whether the target address already contains code
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={status.loading || !inspectAddress}
            onClick={() => runCheck()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? 'animate-spin' : ''}`} />
            <span>Scan Address</span>
          </button>
        </div>
      </div>

      {/* Target Address Input */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
          EVM Target Address to Inspect
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inspectAddress}
            onChange={(e) => setInspectAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-3 py-2 text-xs mono-font input-field"
          />
          <button
            type="button"
            onClick={() => runCheck()}
            disabled={status.loading || !inspectAddress}
            className="px-4 py-2 text-xs btn-primary font-medium"
          >
            Verify State
          </button>
        </div>
      </div>

      {/* Inspection Status Result */}
      {status.checked && (
        <div className="space-y-4">
          {status.error ? (
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/50 text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Inspection Error</p>
                <p className="text-zinc-400 mt-0.5">{status.error}</p>
              </div>
            </div>
          ) : status.isDeployed ? (
            /* Collision Warning: Bytecode exists */
            <div className="p-5 rounded-lg bg-[#181212] border border-rose-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-950/80 border border-rose-700 flex items-center justify-center text-rose-400">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-rose-400">
                      Collision Warning: Contract Already Deployed
                    </h3>
                    <p className="text-xs text-zinc-400">
                      This address already holds bytecode on Botchain Testnet.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  COLLISION DETECTED
                </span>
              </div>

              <div className="pt-2 border-t border-rose-950/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-[#100e0e] border border-rose-950">
                  <span className="text-zinc-500 block text-[11px]">Deployed Bytecode Size</span>
                  <span className="text-white font-mono font-medium">
                    {status.codeLength} bytes
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#100e0e] border border-rose-950">
                  <span className="text-zinc-500 block text-[11px]">BohrScan Link</span>
                  <a
                    href={`https://scan.bohr.life/address/${inspectAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-300 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {status.bytecodePreview && (
                <div className="p-2.5 rounded bg-[#100e0e] border border-rose-950 text-[11px]">
                  <span className="text-zinc-500 block mb-1">Bytecode Preview:</span>
                  <code className="text-zinc-400 font-mono break-all block">
                    {status.bytecodePreview}
                  </code>
                </div>
              )}
            </div>
          ) : (
            /* Clean Address: No code deployed */
            <div className="p-5 rounded-lg bg-[#111612] border border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400">
                      Clean Deterministic Address (Zero Collision)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      No contract or runtime code exists at this address on Botchain Testnet.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  AVAILABLE TO DEPLOY
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-950/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-[#0d120e] border border-emerald-950">
                  <span className="text-zinc-500 block text-[11px]">Address State</span>
                  <span className="text-white font-mono font-medium">Empty (0x code)</span>
                </div>
                <div className="p-2.5 rounded bg-[#0d120e] border border-emerald-950">
                  <span className="text-zinc-500 block text-[11px]">BohrScan Link</span>
                  <a
                    href={`https://scan.bohr.life/address/${inspectAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <span>Inspect Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!status.checked && (
        <div className="p-6 rounded-lg bg-[#141416] border border-dashed border-[#27272a] text-center text-zinc-500 text-xs">
          <HelpCircle className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
          <p>Compute an address in Section 1 or paste any address above to scan for code collisions.</p>
        </div>
      )}
    </div>
  );
};

