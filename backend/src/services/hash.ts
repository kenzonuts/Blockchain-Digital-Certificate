import { createHash } from "crypto";
import fs from "fs";

export function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sha256File(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return sha256Buffer(buffer);
}
