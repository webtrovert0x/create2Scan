# Create2Scan ⬡

> **Deterministic EVM CREATE2 Address Calculator & Bytecode Collision Scanner on Botchain Testnet**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: Botchain Testnet](https://img.shields.io/badge/Network-Botchain%20Testnet%20(968)-27272a.svg)](https://scan.bohr.life)
[![Contract](https://img.shields.io/badge/Contract-0xc2961c0d...1c98-18181b.svg)](https://scan.bohr.life/address/0xc2961c0de0840b56dfd25515045a73506d001c98)
[![GitHub](https://img.shields.io/badge/GitHub-webtrovert0x%2Fcreate2Scan-white.svg)](https://github.com/webtrovert0x/create2Scan)

**Create2Scan** is a developer tool and on-chain inspection protocol engineered for **Botchain Testnet**. It enables developers to calculate, verify, and inspect smart contract addresses before deploying them using the EVM `CREATE2` opcode—preventing costly mistakes, initialization bytecode mismatches, and address collision hazards.

For in-depth mathematical foundations and protocol specifications, read the [Technical Whitepaper](WHITEPAPER.md).

---

## 🚀 Key Capabilities

* **Deterministic CREATE2 Calculation**:
  * Implements standard EIP-1014:
    $$\text{address} = \text{last\_20\_bytes}(\text{keccak256}(0\text{xff} \mathbin{\Vert} \text{deployer} \mathbin{\Vert} \text{salt} \mathbin{\Vert} \text{keccak256}(\text{initCode})))$$
  * Live initialization bytecode hashing and support for direct 32-byte hash inputs.
  * Flexible salt input (Hex `bytes32` or arbitrary text string seeds).
  * Built-in test presets.

* **Existing Deployment & Collision Check**:
  * Real-time query to Botchain Testnet RPC (`https://rpc.bohr.life`) using `eth_getCode(predictedAddress)`.
  * **🟢 Clean Address Badge**: Confirms `0x` empty code—safe for fresh CREATE2 deployment.
  * **🔴 Collision Warning Badge**: Warns if contract bytecode already exists at the address, displaying code size in bytes and BohrScan link.

* **On-Chain Inspection Registry (`Create2Scan.sol`)**:
  * Logs immutable inspection requests on Botchain Testnet.
  * Records requester address, deployer, salt, initialization bytecode hash, and timestamp.
  * Decentralized settlement: anyone can compute and publish verification results.

* **Strictly Gas-Fee-Only**:
  * Zero protocol taxes or token tolls (`0.00 BOT`).
  * Every function interacts with the contract with standard network gas fees only.

* **Normal Black and Gray Developer Interface**:
  * Clean monochrome dark aesthetic (`#09090b`, `#111113`, `#18181b`, `#27272a`, `#3f3f46`, zinc text) designed for optimal contrast and developer focus.

---

## 🌐 Network Details: Botchain Testnet

| Parameter | Specification |
| :--- | :--- |
| **Network Name** | Botchain Testnet |
| **Chain ID** | `968` |
| **RPC URL** | `https://rpc.bohr.life` |
| **Currency Symbol**| `BOT` (18 Decimals) |
| **Block Explorer** | [https://scan.bohr.life/](https://scan.bohr.life/) |
| **Deployed Contract** | [`0xc2961c0de0840b56dfd25515045a73506d001c98`](https://scan.bohr.life/address/0xc2961c0de0840b56dfd25515045a73506d001c98) |
| **Deployment Tx** | [`0xf6164cddd980c865e260b0aa37717161f30d132407cee558d5694589c9dc8176`](https://scan.bohr.life/tx/0xf6164cddd980c865e260b0aa37717161f30d132407cee558d5694589c9dc8176) |

---

## 🖥️ Four Core UI Sections

1. **Address Prediction** ([`src/components/AddressPrediction.tsx`](src/components/AddressPrediction.tsx))
   * Calculate deterministic addresses instantly before sending any transaction.
   * Option to record the prediction inspection on-chain with gas fee only.
2. **Existing Deployment Check** ([`src/components/DeploymentCheck.tsx`](src/components/DeploymentCheck.tsx))
   * Query bytecode state at the predicted address on Botchain Testnet.
   * Detect potential collisions with existing contracts or previous deployments.
3. **Prediction History** ([`src/components/PredictionHistory.tsx`](src/components/PredictionHistory.tsx))
   * Inspect all on-chain requests logged in `Create2Scan.sol`.
   * Filter by "My Requests" or view all requests across the network.
   * Publish results for pending requests.
4. **Request Transaction Details** ([`src/components/RequestDetails.tsx`](src/components/RequestDetails.tsx))
   * Deep-dive lookup by Request ID with full cryptographic parameters and BohrScan explorer links.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
* **Web3 Integration**:
  * `@reown/appkit` (AppKit multichain wallet connection)
  * `@reown/appkit-adapter-wagmi`
  * `wagmi@2.x`
  * `viem`
  * `@tanstack/react-query`
* **Smart Contracts**: Solidity `^0.8.20`, compiled with `solc 0.8.28`

---

## 🏁 Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/webtrovert0x/create2Scan.git
cd create2Scan
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment (`.env`)
Create a `.env` file based on `.env.example`:
```env
# Botchain Testnet Private Key for contract deployment (Optional)
PRIVATE_KEY=your_private_key_here

# Reown Project ID (Cloud WalletConnect)
REOWN_ID=your_reown_project_id_here

# Deployed Create2Scan Contract Address
VITE_CONTRACT_ADDRESS=0xc2961c0de0840b56dfd25515045a73506d001c98
```
> **Privacy Note**: `REOWN_ID` is used directly (without exposing `VITE_REOWN_ID` in public client configs).

### 4. Compile & Deploy (Optional)
To re-compile the contract:
```bash
npm run compile
```

To deploy to Botchain Testnet:
```bash
npm run deploy
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📜 Smart Contract Interface (`Create2Scan.sol`)

```solidity
// Request a new deterministic address inspection (Gas fee only)
function requestPrediction(address deployer, bytes32 salt, bytes32 initCodeHash) external returns (uint256 requestId);

// Publish and finalize the inspection result (Gas fee only)
function publishResult(uint256 requestId, address predictedAddress, bool isDeployed) external;

// Query a stored prediction request by ID
function getRequest(uint256 requestId) external view returns (PredictionRequest memory);

// Pure on-chain CREATE2 address calculation helper
function computeAddress(address deployer, bytes32 salt, bytes32 initCodeHash) public pure returns (address);

// Incremental global counter
uint256 public requestNonce;
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
