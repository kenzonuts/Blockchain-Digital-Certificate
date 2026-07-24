import { Contract, JsonRpcProvider, Wallet, getBytes, hexlify } from "ethers";
import { env } from "../config/env";

const REGISTRY_ABI = [
  "function issueCertificate(string certificateId, bytes32 certificateHash) external",
  "function getCertificate(string certificateId) view returns (string id, bytes32 certificateHash, address issuer, uint256 issuedAt)",
  "function exists(string certificateId) view returns (bool)",
  "event CertificateIssued(string certificateId, bytes32 certificateHash, address indexed issuer, uint256 issuedAt)",
] as const;

export type OnChainCertificate = {
  certificateId: string;
  certificateHash: string;
  issuer: string;
  issuedAt: number;
};

function requireReadConfig() {
  if (!env.blockchainRpcUrl) {
    throw new Error("BLOCKCHAIN_RPC_URL is not configured");
  }
  if (!env.certificateRegistryAddress) {
    throw new Error("CERTIFICATE_REGISTRY_ADDRESS is not configured");
  }
}

function requireWriteConfig() {
  requireReadConfig();
  if (!env.blockchainPrivateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not configured");
  }
}

function getProvider() {
  requireReadConfig();
  return new JsonRpcProvider(env.blockchainRpcUrl);
}

function getWallet() {
  requireWriteConfig();
  const provider = getProvider();
  return new Wallet(env.blockchainPrivateKey, provider);
}

function getRegistry(signerOrProvider?: Wallet | JsonRpcProvider) {
  requireReadConfig();
  const runner = signerOrProvider ?? getProvider();
  return new Contract(
    env.certificateRegistryAddress,
    REGISTRY_ABI,
    runner
  );
}

/** Convert SHA-256 hex (with or without 0x) to bytes32 hex. */
export function hashToBytes32(sha256Hex: string): string {
  const cleaned = sha256Hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[a-f0-9]{64}$/.test(cleaned)) {
    throw new Error("certificateHash must be a 64-char SHA-256 hex string");
  }
  return hexlify(getBytes(`0x${cleaned}`));
}

export function bytes32ToHash(value: string): string {
  return value.replace(/^0x/, "").toLowerCase();
}

export async function issueCertificateOnChain(input: {
  certificateId: string;
  certificateHash: string;
}): Promise<{
  transactionHash: string;
  blockNumber: number;
  blockchainTimestamp: Date;
  issuerWallet: string;
}> {
  const wallet = getWallet();
  const registry = getRegistry(wallet);
  const bytes32Hash = hashToBytes32(input.certificateHash);

  const alreadyExists = await registry.exists(input.certificateId);
  if (alreadyExists) {
    throw new Error("Certificate already issued on blockchain");
  }

  const tx = await registry.issueCertificate(
    input.certificateId,
    bytes32Hash
  );
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Blockchain transaction failed");
  }

  const blockNumber = Number(receipt.blockNumber);
  const block = await wallet.provider!.getBlock(blockNumber);
  const blockchainTimestamp = new Date(
    Number(block?.timestamp ?? Math.floor(Date.now() / 1000)) * 1000
  );

  return {
    transactionHash: receipt.hash,
    blockNumber,
    blockchainTimestamp,
    issuerWallet: wallet.address,
  };
}

export async function getCertificateOnChain(
  certificateId: string
): Promise<OnChainCertificate | null> {
  const registry = getRegistry();
  const exists = await registry.exists(certificateId);
  if (!exists) return null;

  const result = await registry.getCertificate(certificateId);
  return {
    certificateId: result.id as string,
    certificateHash: bytes32ToHash(result.certificateHash as string),
    issuer: result.issuer as string,
    issuedAt: Number(result.issuedAt),
  };
}
