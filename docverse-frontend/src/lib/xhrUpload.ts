export class XhrUploadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "XhrUploadError";
    this.status = status;
  }
}

const blobToText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read response"));
    reader.readAsText(blob);
  });
};

const tryExtractJsonMessage = async (blob: Blob): Promise<string | null> => {
  try {
    const text = await blobToText(blob);
    const data = JSON.parse(text);
    if (data && typeof data.message === "string") {
      return data.message;
    }
    return null;
  } catch {
    return null;
  }
};

export const xhrUploadForBlob = async (opts: {
  url: string;
  formData: FormData;
  onProgress?: (progress: number) => void;
  progressStart?: number;
  progressCap?: number;
  progressTickMs?: number;
  progressTickAmount?: number;
}): Promise<{ blob: Blob; contentType: string; disposition: string }> => {
  const {
    url,
    formData,
    onProgress,
    progressStart = 8,
    progressCap = 92,
    progressTickMs = 100,
    progressTickAmount = 4,
  } = opts;

  if (onProgress) onProgress(progressStart);

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);
    xhr.responseType = "blob";

    let currentProgress = progressStart;
    const interval = window.setInterval(() => {
      if (!onProgress) return;
      if (currentProgress >= progressCap) return;
      const next = currentProgress + progressTickAmount;
      currentProgress = next > progressCap ? progressCap : next;
      onProgress(currentProgress);
    }, progressTickMs);

    xhr.onload = async () => {
      window.clearInterval(interval);

      const contentType = xhr.getResponseHeader("Content-Type") || "";
      const disposition = xhr.getResponseHeader("Content-Disposition") || "";

      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response as Blob;
        if (onProgress) onProgress(100);
        resolve({ blob, contentType, disposition });
        return;
      }

      const blob = xhr.response as Blob;
      const apiMessage = blob ? await tryExtractJsonMessage(blob) : null;
      reject(new XhrUploadError(apiMessage || `Request failed with status ${xhr.status}`,
        xhr.status
      ));
    };

    xhr.onerror = () => {
      window.clearInterval(interval);
      reject(new XhrUploadError("Network error while uploading files", 0));
    };

    xhr.send(formData);
  });
};
