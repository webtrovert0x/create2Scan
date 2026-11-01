import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AddressPrediction } from './components/AddressPrediction';
import { DeploymentCheck } from './components/DeploymentCheck';
import { PredictionHistory } from './components/PredictionHistory';
import { RequestDetails } from './components/RequestDetails';
import { ContractConfigModal } from './components/ContractConfigModal';
import { CONTRACT_ADDRESS } from './config/env';
import type { Create2CalculationResult } from './utils/create2';
import {
  Calculator,
  Search,
  History,
  FileText,
  Settings,
  Fuel,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';

export function App() {
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem('create2scan_contract') || CONTRACT_ADDRESS || '';
  });

  const [activeTab, setActiveTab] = useState<'all' | 'prediction' | 'deployment' | 'history' | 'details'>('all');
  const [predictedResult, setPredictedResult] = useState<Create2CalculationResult | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('1');
  const [recentTxHash, setRecentTxHash] = useState<string | undefined>(undefined);
  const [refreshHistoryCount, setRefreshHistoryCount] = useState<number>(0);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const handleSaveContractAddress = (newAddr: string) => {
    setContractAddress(newAddr);
    localStorage.setItem('create2scan_contract', newAddr);
  };

  const handleRequestCreated = (reqId: string, txHash: string) => {
    setSelectedRequestId(reqId);
    setRecentTxHash(txHash);
    setRefreshHistoryCount((prev) => prev + 1);
  };

  const handleSelectRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    setActiveTab('all');
    // Scroll smoothly to Request Details
    const element = document.getElementById('section-details');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#3f3f46] selection:text-white">
      {/* Top Navigation */}
      <Header contractAddress={contractAddress} />

      {/* Hero / Quick Context Bar */}
      <div className="border-b border-[#27272a] bg-[#101013] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1f1f23] text-zinc-300 border border-[#27272a]">
                Botchain Testnet Native
              </span>
              <span className="text-xs flex items-center gap-1 text-zinc-400">
                <Fuel className="w-3.5 h-3.5 text-zinc-400" />
                Interactions: <strong className="text-zinc-200">Gas fee only</strong>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Calculate CREATE2 addresses deterministically, detect collisions with deployed bytecode, and record inspection proofs on Botchain.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Contract Setup</span>
            </button>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <span>BohrScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Navigation Tabs for quick filtering or complete layout */}
        <div className="flex items-center gap-1.5 border-b border-[#27272a] pb-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
            }`}
          >
            All 4 Sections
          </button>
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'prediction'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>1. Address Prediction</span>
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'deployment'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>2. Deployment Check</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>3. Prediction History</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Transaction Details</span>
          </button>
        </div>

        {/* Section 1: Address Prediction */}
        {(activeTab === 'all' || activeTab === 'prediction') && (
          <section id="section-prediction">
            <AddressPrediction
              contractAddress={contractAddress}
              onPredictionComputed={(res) => setPredictedResult(res)}
              onRequestCreated={handleRequestCreated}
            />
          </section>
        )}

        {/* Section 2: Existing Deployment Check */}
        {(activeTab === 'all' || activeTab === 'deployment') && (
          <section id="section-deployment">
            <DeploymentCheck
              predictedAddress={predictedResult?.predictedAddress}
            />
          </section>
        )}

        {/* Section 3: Prediction History */}
        {(activeTab === 'all' || activeTab === 'history') && (
          <section id="section-history">
            <PredictionHistory
              contractAddress={contractAddress}
              onSelectRequest={handleSelectRequest}
              refreshTrigger={refreshHistoryCount}
            />
          </section>
        )}

        {/* Section 4: Request Transaction Details */}
        {(activeTab === 'all' || activeTab === 'details') && (
          <section id="section-details">
            <RequestDetails
              contractAddress={contractAddress}
              selectedRequestId={selectedRequestId}
              recentTxHash={recentTxHash}
              onRequestPublished={() => setRefreshHistoryCount((p) => p + 1)}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272a] bg-[#0c0c0e] py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <span>Create2Scan &bull; Botchain Testnet (Chain ID 968)</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>RPC: https://rpc.bohr.life</span>
            <span>Token: BOT</span>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white underline"
            >
              Explorer
            </a>
          </div>
        </div>
      </footer>

      {/* Contract Config Modal */}
      <ContractConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentAddress={contractAddress}
        onSaveAddress={handleSaveContractAddress}
      />
    </div>
  );
}

export default App;

