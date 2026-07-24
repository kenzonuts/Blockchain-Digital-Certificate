import { Router } from "express";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/", (_req, res) => {
  const rpc = env.blockchainRpcUrl;
  const isLocal =
    rpc.includes("127.0.0.1") ||
    rpc.includes("localhost") ||
    rpc.includes("8545");

  res.json({
    settings: {
      appUrl: env.appUrl,
      corsOrigin: env.corsOrigin,
      blockchainRpcUrl: rpc || null,
      certificateRegistryAddress: env.certificateRegistryAddress || null,
      networkLabel: !rpc
        ? "Not configured"
        : isLocal
          ? "Local Hardhat"
          : rpc.toLowerCase().includes("sepolia")
            ? "Sepolia"
            : "Custom EVM RPC",
      issuerWalletConfigured: Boolean(env.blockchainPrivateKey),
    },
  });
});
