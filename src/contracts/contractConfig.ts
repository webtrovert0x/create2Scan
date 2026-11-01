export const CREATE2_SCAN_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "requester", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "deployer", "type": "address" },
      { "indexed": false, "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "initCodeHash", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PredictionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "requester", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "predictedAddress", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "isDeployed", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PredictionPublished",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "deployer", "type": "address" },
      { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      { "internalType": "bytes32", "name": "initCodeHash", "type": "bytes32" }
    ],
    "name": "requestPrediction",
    "outputs": [{ "internalType": "uint256", "name": "requestId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "internalType": "address", "name": "predictedAddress", "type": "address" },
      { "internalType": "bool", "name": "isDeployed", "type": "bool" }
    ],
    "name": "publishResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "requestId", "type": "uint256" }],
    "name": "getRequest",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "requester", "type": "address" },
          { "internalType": "address", "name": "deployer", "type": "address" },
          { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
          { "internalType": "bytes32", "name": "initCodeHash", "type": "bytes32" },
          { "internalType": "address", "name": "predictedAddress", "type": "address" },
          { "internalType": "bool", "name": "isDeployed", "type": "bool" },
          { "internalType": "bool", "name": "completed", "type": "bool" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Create2Scan.PredictionRequest",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestNonce",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "deployer", "type": "address" },
      { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      { "internalType": "bytes32", "name": "initCodeHash", "type": "bytes32" }
    ],
    "name": "computeAddress",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserRequestIds",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "limit", "type": "uint256" }],
    "name": "getRecentRequests",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "requester", "type": "address" },
          { "internalType": "address", "name": "deployer", "type": "address" },
          { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
          { "internalType": "bytes32", "name": "initCodeHash", "type": "bytes32" },
          { "internalType": "address", "name": "predictedAddress", "type": "address" },
          { "internalType": "bool", "name": "isDeployed", "type": "bool" },
          { "internalType": "bool", "name": "completed", "type": "bool" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Create2Scan.PredictionRequest[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

