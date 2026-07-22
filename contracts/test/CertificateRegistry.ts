import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertificateRegistry", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();
    return { registry, owner, other };
  }

  it("issues a certificate and returns it", async function () {
    const { registry, owner } = await deployFixture();
    const certificateId = "CERT-2026-00001";
    const hash = ethers.id("sample-pdf-bytes");

    await expect(registry.issueCertificate(certificateId, hash)).to.emit(
      registry,
      "CertificateIssued"
    );

    const result = await registry.getCertificate(certificateId);
    expect(result.id).to.equal(certificateId);
    expect(result.certificateHash).to.equal(hash);
    expect(result.issuer).to.equal(owner.address);
    expect(result.issuedAt).to.be.gt(0);
    expect(await registry.exists(certificateId)).to.equal(true);
  });

  it("rejects duplicate certificate ids", async function () {
    const { registry } = await deployFixture();
    const certificateId = "CERT-DUP";
    const hash = ethers.id("a");

    await registry.issueCertificate(certificateId, hash);
    await expect(
      registry.issueCertificate(certificateId, ethers.id("b"))
    ).to.be.revertedWith("Certificate already issued");
  });

  it("rejects non-owner issuer", async function () {
    const { registry, other } = await deployFixture();
    await expect(
      registry.connect(other).issueCertificate("CERT-X", ethers.id("x"))
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("reverts getCertificate for unknown id", async function () {
    const { registry } = await deployFixture();
    await expect(registry.getCertificate("MISSING")).to.be.revertedWith(
      "Certificate not found"
    );
  });
});
