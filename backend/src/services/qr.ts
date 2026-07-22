import QRCode from "qrcode";
import { env } from "../config/env";

export function buildVerifyUrl(certificateId: string): string {
  const base = env.appUrl.replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(certificateId)}`;
}

export async function generateQrPng(certificateId: string): Promise<Buffer> {
  const url = buildVerifyUrl(certificateId);
  return QRCode.toBuffer(url, {
    type: "png",
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
