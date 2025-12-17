import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

export const execFileAsync = promisify(execFile);

export const streamToBuffer = async (readStream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    readStream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    readStream.on("end", () => resolve(Buffer.concat(chunks)));
    readStream.on("error", reject);
  });
};

export const safeDestroyStream = (readStream?: fs.ReadStream) => {
  try {
    readStream?.destroy();
  } catch {
  }
};
