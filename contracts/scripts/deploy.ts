import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CertificateRegistry with:", deployer.address);

  const Registry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CertificateRegistry deployed to:", address);
  console.log("Owner:", deployer.address);
  console.log("");
  console.log("Add these to backend/.env:");
  console.log(`CERTIFICATE_REGISTRY_ADDRESS=${address}`);
  console.log(`BLOCKCHAIN_RPC_URL=${process.env.LOCAL_RPC_URL ?? "http://127.0.0.1:8545"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
