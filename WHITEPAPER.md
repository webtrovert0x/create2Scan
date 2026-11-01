# Create2Scan: Technical Whitepaper
**A Deterministic EVM Address Computation, Bytecode Inspection, and Pre-Deployment Collision Verification Protocol on Botchain Testnet**

**Version:** 1.0.0  
**Target Network:** Botchain Testnet (Chain ID: 968)  
**Contract Address:** `0xc2961c0de0840b56dfd25515045a73506d001c98`  
**Repository:** [https://github.com/webtrovert0x/create2Scan](https://github.com/webtrovert0x/create2Scan)  
**Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)  

---

## 1. Abstract

The introduction of the `CREATE2` opcode in Ethereum Improvement Proposal 1014 (EIP-1014) enabled deterministic smart contract deployment independent of factory nonces. While this capability underpins modern counterfactual smart contract architectures—such as account abstraction wallets, decentralized exchange liquidity pools, and payment channels—it introduces substantial operational vulnerabilities. Subtle discrepancies in initialization bytecode, constructor arguments, or deployer addresses produce divergent addresses, while improper salt re-use risks disastrous address collisions or irreversible deployment failures.

**Create2Scan** is a decentralized developer utility and on-chain inspection protocol engineered for the **Botchain Testnet**. It enables smart contract developers to pre-calculate deterministic addresses, inspect active network state for existing bytecode via `eth_getCode`, log immutable inspection requests on-chain, and publish verifiable collision reports. Crucially, the protocol operates under a strict **Gas-Fee-Only** economic model, eliminating protocol rent-seeking and requiring users to pay only base EVM gas fees.

---

## 2. Problem Statement & Motivation

### 2.1 The Limits of Nonce-Based Deployment (`CREATE`)
Standard EVM contract deployment (`CREATE`) derives contract addresses strictly from the deployer account address and its current transaction nonce:
$$\text{address} = \text{last\_20\_bytes}(\text{keccak256}(\text{rlp.encode}([\text{deployer}, \text{nonce}])))$$

Because the deployer's nonce increments with every transaction, predicting deployment addresses across multichain environments or asynchronous multi-step setups is brittle. Any transaction reordering or parallel operation disrupts the sequence, invalidating downstream contract interactions.

### 2.2 The Determinism of `CREATE2`
EIP-1014 introduced `CREATE2` to decouple address computation from transaction sequence numbers:
$$\text{address} = \text{last\_20\_bytes}(\text{keccak256}(0\text{xff} \mathbin{\Vert} \text{deployer} \mathbin{\Vert} \text{salt} \mathbin{\Vert} \text{keccak256}(\text{initCode})))$$

Where:
* `0xff` is a 1-byte constant preventing collisions with standard `CREATE`.
* `deployer` is the 20-byte address of the factory contract executing `CREATE2`.
* `salt` is a 32-byte (`bytes32`) arbitrary value supplied by the caller.
* `keccak256(initCode)` is the 32-byte cryptographic hash of the contract creation bytecode (including ABI-encoded constructor parameters).

### 2.3 Real-World Failure Modes
Despite its power, developers face three major failure vectors:
1. **Initcode Mutation**: Changing compiler versions, optimizer settings, metadata hashes, or constructor parameters alters `keccak256(initCode)`, generating a completely different target address than intended.
2. **Pre-Existing Address Collision**: If an address has already had bytecode deployed to it (or previously self-destructed prior to Cancun/Dencun EVM revisions), calling `CREATE2` with the same parameters will immediately revert, resulting in permanent lockouts or lost gas fees.
3. **Lack of On-Chain Verifiability**: Teams lack a shared, immutable registry on testnets to record planned factory deployments, register salt reservations, and audit deployment states prior to mainnet distribution.

---

## 3. The Create2Scan Protocol Architecture

Create2Scan bridges high-precision off-chain cryptographic calculation with on-chain immutable tracking on Botchain Testnet.

```
+-------------------------------------------------------------------------------+
|                             Create2Scan Web App                               |
|  (Normal Black & Gray Theme, Reown AppKit + Wagmi v2 + Viem on Botchain)      |
+-------------------------------------------------------------------------------+
         |                                                           |
         | 1. Pure Math                                              | 2. RPC State Inspection
         v                                                           v
+-----------------------------+                             +--------------------+
| Deterministic Computation   |                             | Botchain Testnet   |
| keccak256(0xff ++ deployer  |                             | RPC Node           |
| ++ salt ++ initCodeHash)    |                             | (rpc.bohr.life)    |
+-----------------------------+                             +--------------------+
         |                                                           |
         | Result                                                    | eth_getCode(addr)
         v                                                           v
+-------------------------------------------------------------------------------+
| Collision Analysis Engine                                                     |
| [Clean: 0x empty bytecode]  OR  [Collision: Bytecode length > 0 detected]      |
+-------------------------------------------------------------------------------+
         |
         | 3. On-chain Verification (Gas Fee Only)
         v
+-------------------------------------------------------------------------------+
| Create2Scan.sol Smart Contract (Botchain Testnet: 0xc2961c0d...1c98)          |
| - requestPrediction(deployer, salt, initCodeHash)                             |
| - publishResult(requestId, predictedAddress, isDeployed)                      |
| - getRequest(requestId) & computeAddress()                                    |
+-------------------------------------------------------------------------------+
```

---

## 4. Mathematical & Cryptographic Specification

### 4.1 Address Calculation Pipeline
Given:
* Deployer address: $A \in \mathbb{B}^{20}$
* Salt: $S \in \mathbb{B}^{32}$
* Initialization code: $I \in \mathbb{B}^*$
* Computed code hash: $H = \text{keccak256}(I) \in \mathbb{B}^{32}$

The buffer to be hashed is concatenated as a 85-byte binary structure:
$$\mathcal{B} = \mathtt{0xff} \mathbin{\Vert} A \mathbin{\Vert} S \mathbin{\Vert} H$$

The deterministic address is computed by taking the 256-bit Keccak digest of $\mathcal{B}$ and truncating to the lower 160 bits (20 bytes):
$$\text{Addr}(A, S, H) = \text{keccak256}(\mathcal{B})[12 \dots 31]$$

### 4.2 Dynamic Input Normalization
Create2Scan supports flexible developer inputs with real-time normalization:
* **Hex Salt Input**: User passes hex string `0x...` up to 64 hex characters (32 bytes). Shorter strings are padded to 32 bytes (`pad(hex, { size: 32 })`).
* **String Seed Input**: User passes arbitrary text (e.g., `production-token-v1`). The system applies $\text{keccak256}(\text{utf8}(S))$ to create an entropy-rich 32-byte salt.
* **Raw Creation Bytecode**: Full hexadecimal initialization code including constructor arguments; hashed via $\text{keccak256}$.
* **Direct Hash**: Precomputed 32-byte hash (66 hex characters with `0x`), validated for exact length.

---

## 5. Economic & Interaction Model: Gas Fee Only

A foundational principle of Create2Scan is **zero protocol overhead**:
* **No Payable Functions**: All functions in `Create2Scan.sol` are defined without the `payable` modifier.
* **No Treasury / Protocol Tolls**: The protocol charges `0.00 BOT` fees.
* **Gas Consumption Only**: Callers pay standard EVM gas directly to Botchain Testnet validators to process state mutations.
* **Free View Invocations**: Address calculation via `computeAddress()` and state lookups via `getRequest()` and `getRecentRequests()` are pure/view calls, incurring zero gas when queried off-chain.

---

## 6. Smart Contract Specification: `Create2Scan.sol`

The smart contract is written in Solidity `^0.8.20` and deployed on Botchain Testnet.

### 6.1 Data Structures
```solidity
struct PredictionRequest {
    uint256 id;
    address requester;
    address deployer;
    bytes32 salt;
    bytes32 initCodeHash;
    address predictedAddress;
    bool isDeployed;
    bool completed;
    uint256 timestamp;
}
```

### 6.2 State Variables
* `uint256 public requestNonce`: Incremental counter tracking total inspection requests.
* `mapping(uint256 => PredictionRequest) public requests`: Mapping of request IDs to full inspection records.
* `mapping(address => uint256[]) private _userRequestIds`: Indexes request IDs per user address.

### 6.3 Interface & Function Signatures
```solidity
function requestPrediction(address deployer, bytes32 salt, bytes32 initCodeHash) external returns (uint256 requestId);
function publishResult(uint256 requestId, address predictedAddress, bool isDeployed) external;
function getRequest(uint256 requestId) external view returns (PredictionRequest memory);
function computeAddress(address deployer, bytes32 salt, bytes32 initCodeHash) public pure returns (address);
function getUserRequestIds(address user) external view returns (uint256[] memory);
function getRecentRequests(uint256 limit) external view returns (PredictionRequest[] memory);
```

### 6.4 Events
```solidity
event PredictionRequested(
    uint256 indexed requestId,
    address indexed requester,
    address indexed deployer,
    bytes32 salt,
    bytes32 initCodeHash,
    uint256 timestamp
);

event PredictionPublished(
    uint256 indexed requestId,
    address indexed requester,
    address predictedAddress,
    bool isDeployed,
    uint256 timestamp
);
```

---

## 7. Frontend Architecture & Modular Design

The frontend follows an engineering-focused **normal black and gray** visual language (`#09090b`, `#111113`, `#18181b`, `#27272a`, `#3f3f46`) designed to minimize eye fatigue during extended debugging sessions.

### 7.1 Four Distinct Functional Modules
1. **Section 1: Address Prediction**
   * Real-time calculation engine reacting to deployer, salt, and bytecode changes.
   * Preset fixtures (Sample Factory, Text Salt & Direct Hash) for instant testing.
   * On-chain request registration invoking `requestPrediction()`.
2. **Section 2: Existing Deployment Check**
   * Real-time query to Botchain Testnet RPC using `eth_getCode(predictedAddress)`.
   * **Clean Address status**: Confirms empty address (`0x` bytecode), safe for deployment.
   * **Collision status**: Warns if contract bytecode exists, displaying byte length, code preview, and BohrScan link.
3. **Section 3: Prediction History**
   * Live feed of inspection requests retrieved directly from the smart contract.
   * "Filter: My Requests" toggle.
   * Decentralized "Publish Result (Gas Only)" action button allowing any caller to finalize an unverified request.
4. **Section 4: Request Transaction Details**
   * Deep-dive inspect view for any request ID or recent transaction hash.
   * High-contrast breakdown of parameters, timestamps, verification badges, and direct links to BohrScan.

### 7.2 Web3 Integration
* **Reown AppKit** (`@reown/appkit`): Multichain wallet modal integration using dedicated `REOWN_ID`.
* **Wagmi v2 & Viem**: Type-safe contract read/write interactions and public client RPC state queries.
* **TanStack React Query**: Efficient cache invalidation and transaction receipt tracking.

---

## 8. Network Deployment Verification

| Property | Value |
| :--- | :--- |
| **Network** | Botchain Testnet |
| **Chain ID** | `968` |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Native Currency** | `BOT` (18 Decimals) |
| **Contract Address** | `0xc2961c0de0840b56dfd25515045a73506d001c98` |
| **Deployment Tx Hash**| `0xf6164cddd980c865e260b0aa37717161f30d132407cee558d5694589c9dc8176` |
| **Deployer Address** | `0x55DA37AbbF8C9141adA4Dd1C2eF7211c0483eC16` |
| **Explorer** | [https://scan.bohr.life/](https://scan.bohr.life/) |

---

## 9. Security Considerations

1. **Frontrunning Protection**: Recording an address prediction on-chain announces the deployer and salt. If deployment of the intended factory is permissionless, adversaries could attempt to deploy malicious bytecode to that address first. **Mitigation**: When deploying sensitive counterfactual contracts, ensure the factory itself enforces authentication on `msg.sender` during the `CREATE2` call.
2. **Post-Dencun Selfdestruct Semantics**: Following EIP-6780 (Cancun/Dencun), `SELFDESTRUCT` only deletes bytecode if executed in the same transaction as contract creation. Addresses containing existing bytecode will not be reset in subsequent transactions, rendering collision detection even more vital.
3. **Environment Isolation**: Private keys (`PRIVATE_KEY`) and project credentials (`REOWN_ID`) are strictly segregated in `.env` and excluded from source control.

---

## 10. Conclusion

Create2Scan introduces a deterministic inspection standard for factory-based contract deployments on Botchain Testnet. By uniting pure EVM mathematical address computation, real-time RPC bytecode verification, and an on-chain immutable inspection registry with a **Gas-Fee-Only** architecture, Create2Scan empowers EVM developers to deploy with absolute certainty and zero collision risk.
