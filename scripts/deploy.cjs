const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { compileContract } = require('./compile.cjs');

// Define Botchain Testnet
const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
});

async function main() {
  console.log('--- Deploying Create2Scan to Botchain Testnet (Chain ID: 968) ---');

  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === '') {
    console.error('❌ Error: PRIVATE_KEY is not defined in .env');
    console.error('Please add your Botchain Testnet private key in the .env file:');
    console.error('PRIVATE_KEY=0x...');
    process.exit(1);
  }

  privateKey = privateKey.trim();
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }

  // Compile first or load existing
  const artifactPath = path.resolve(__dirname, '../src/contracts/Create2Scan.json');
  let artifact;
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } else {
    artifact = compileContract();
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`Deployer Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: botchainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const walletClient = createWalletClient({
    account,
    chain: botchainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer Balance: ${Number(balance) / 1e18} BOT`);

  if (balance === 0n) {
    console.warn('⚠️ Warning: Deployer balance is 0 BOT. Make sure your account has testnet BOT for gas.');
  }

  console.log('Sending deployment transaction...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log(`Transaction Hash: ${hash}`);
  console.log(`View on explorer: https://scan.bohr.life/tx/${hash}`);
  console.log('Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'success') {
    const deployedAddress = receipt.contractAddress;
    console.log(`\n🎉 Create2Scan deployed successfully!`);
    console.log(`Contract Address: ${deployedAddress}`);
    console.log(`Explorer Link: https://scan.bohr.life/address/${deployedAddress}`);

    // Update .env file
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('VITE_CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(
          /VITE_CONTRACT_ADDRESS=.*/g,
          `VITE_CONTRACT_ADDRESS=${deployedAddress}`
        );
      } else {
        envContent += `\nVITE_CONTRACT_ADDRESS=${deployedAddress}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`✅ Updated VITE_CONTRACT_ADDRESS in .env`);
    }
  } else {
    console.error('❌ Deployment transaction failed or reverted.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});

