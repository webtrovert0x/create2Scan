const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compileContract() {
  console.log('Compiling contracts/Create2Scan.sol...');
  const contractPath = path.resolve(__dirname, '../contracts/Create2Scan.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'Create2Scan.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('Error:', error.formattedMessage);
        hasError = true;
      } else {
        console.warn('Warning:', error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const contractData = output.contracts['Create2Scan.sol']['Create2Scan'];
  const abi = contractData.abi;
  const bytecode = contractData.evm.bytecode.object;

  const targetDir = path.resolve(__dirname, '../src/contracts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const artifact = {
    contractName: 'Create2Scan',
    abi,
    bytecode: '0x' + bytecode,
    deployedBytecode: '0x' + contractData.evm.deployedBytecode.object,
    compiler: '0.8.28',
    timestamp: new Date().toISOString()
  };

  const artifactPath = path.join(targetDir, 'Create2Scan.json');
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

  console.log(`Compilation successful! Artifact saved to: ${artifactPath}`);
  return artifact;
}

if (require.main === module) {
  compileContract();
}

module.exports = { compileContract };

