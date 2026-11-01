import {
  isAddress,
  keccak256,
  toBytes,
  pad,
  toHex,
  getContractAddress,
  type Hex,
  type Address,
  createPublicClient,
  http,
} from 'viem';
import { botchainTestnet } from '../config/chains';

// Public client dedicated to Botchain Testnet RPC
export const botchainPublicClient = createPublicClient({
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
});

export interface Create2CalculationInput {
  deployer: string;
  saltInput: string;
  isSaltHex: boolean;
  bytecodeInput: string;
  isBytecodeHash: boolean;
}

export interface Create2CalculationResult {
  valid: boolean;
  error?: string;
  deployer?: Address;
  normalizedSalt?: Hex;
  initCodeHash?: Hex;
  predictedAddress?: Address;
}

export interface DeploymentCheckResult {
  checked: boolean;
  loading: boolean;
  isDeployed: boolean;
  codeLength: number;
  bytecodePreview?: string;
  error?: string;
}

/**
 * Normalizes user salt input into a valid 32-byte Hex string.
 */
export function formatSalt(input: string, treatAsRawHex: boolean): { salt?: Hex; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: 'Salt cannot be empty' };
  }

  try {
    if (treatAsRawHex) {
      const cleanHex = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
      if (!/^0x[0-9a-fA-F]+$/.test(cleanHex)) {
        return { error: 'Invalid hex salt format' };
      }
      if (cleanHex.length > 66) {
        return { error: 'Hex salt exceeds 32 bytes (64 hex characters)' };
      }
      // Pad to 32 bytes
      const padded = pad(cleanHex as Hex, { size: 32 });
      return { salt: padded };
    } else {
      // Treat as string seed and hash it to 32 bytes
      const hashed = keccak256(toBytes(trimmed));
      return { salt: hashed };
    }
  } catch (err: any) {
    return { error: err?.message || 'Error processing salt' };
  }
}

/**
 * Normalizes initialization bytecode or initCodeHash into a 32-byte Hex hash.
 */
export function formatInitCodeHash(
  input: string,
  isDirectHash: boolean
): { hash?: Hex; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: 'Bytecode or Bytecode Hash is required' };
  }

  try {
    const cleanHex = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;

    if (!/^0x[0-9a-fA-F]*$/.test(cleanHex)) {
      return { error: 'Input must be valid hexadecimal characters' };
    }

    if (isDirectHash) {
      if (cleanHex.length !== 66) {
        return {
          error: `Init code hash must be exactly 32 bytes (64 hex chars). Received ${cleanHex.length - 2} chars.`,
        };
      }
      return { hash: cleanHex as Hex };
    } else {
      if (cleanHex.length <= 2) {
        return { error: 'Bytecode is too short' };
      }
      // Raw bytecode to be hashed
      const hashed = keccak256(cleanHex as Hex);
      return { hash: hashed };
    }
  } catch (err: any) {
    return { error: err?.message || 'Error processing bytecode' };
  }
}

/**
 * Pure CREATE2 Address Calculation using Viem's built-in getContractAddress.
 */
export function calculateCreate2Address(
  params: Create2CalculationInput
): Create2CalculationResult {
  const { deployer, saltInput, isSaltHex, bytecodeInput, isBytecodeHash } = params;

  if (!deployer || !isAddress(deployer.trim())) {
    return { valid: false, error: 'Invalid or missing Deployer/Factory address' };
  }

  const saltRes = formatSalt(saltInput, isSaltHex);
  if (saltRes.error || !saltRes.salt) {
    return { valid: false, error: saltRes.error };
  }

  const hashRes = formatInitCodeHash(bytecodeInput, isBytecodeHash);
  if (hashRes.error || !hashRes.hash) {
    return { valid: false, error: hashRes.error };
  }

  try {
    const predicted = getContractAddress({
      opcode: 'CREATE2',
      from: deployer.trim() as Address,
      salt: saltRes.salt,
      bytecodeHash: hashRes.hash,
    });

    return {
      valid: true,
      deployer: deployer.trim() as Address,
      normalizedSalt: saltRes.salt,
      initCodeHash: hashRes.hash,
      predictedAddress: predicted,
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Calculation failed' };
  }
}

/**
 * Query Botchain Testnet RPC to verify if the address already contains code.
 */
export async function checkAddressDeployment(
  address: Address
): Promise<DeploymentCheckResult> {
  try {
    const code = await botchainPublicClient.getBytecode({ address });
    if (!code || code === '0x') {
      return {
        checked: true,
        loading: false,
        isDeployed: false,
        codeLength: 0,
        bytecodePreview: '0x',
      };
    }

    const byteLength = (code.length - 2) / 2;
    const preview = code.length > 66 ? `${code.slice(0, 66)}...` : code;

    return {
      checked: true,
      loading: false,
      isDeployed: true,
      codeLength: byteLength,
      bytecodePreview: preview,
    };
  } catch (err: any) {
    return {
      checked: true,
      loading: false,
      isDeployed: false,
      codeLength: 0,
      error: err?.message || 'Failed to inspect address bytecode from Botchain RPC',
    };
  }
}

