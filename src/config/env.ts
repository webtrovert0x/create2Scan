// Environment helper reading injected REOWN_ID and contract addresses
export const REOWN_ID: string =
  (typeof process !== 'undefined' && process.env && process.env.REOWN_ID) ||
  '';

export const CONTRACT_ADDRESS: string =
  (typeof process !== 'undefined' && process.env && process.env.VITE_CONTRACT_ADDRESS) ||
  '0xc2961c0de0840b56dfd25515045a73506d001c98';

