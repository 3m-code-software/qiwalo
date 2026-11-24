import { prepareImage } from "@/lib/client-image";

export type UploadResult = {
  url: string;
  originalSize: number;
  compressedSize: number;
};

export class UploadError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/** Compress in the browser, then upload with real XHR progress. */
export async function uploadImage(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const originalSize = file.size;
  onProgress(5);
  const payload = await prepareImage(file);
  onProgress(10);

  const body = new FormData();
  body.set("file", payload);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(95, 10 + Math.round((event.loaded / event.total) * 85)));
      } else {
        onProgress(55);
      }
    };
    xhr.onload = () => {
      let json: { url?: string; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText) as { url?: string; error?: string };
      } catch {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.url) {
        onProgress(100);
        resolve({ url: json.url, originalSize, compressedSize: payload.size });
        return;
      }
      reject(new UploadError(
        xhr.status === 413
          ? "حجم الصورة كبير جداً — جرّب صورة أصغر."
          : json.error ?? `الرفع فشل (${xhr.status}). حاول مرة تانية.`,
        xhr.status,
      ));
    };
    xhr.onerror = () => reject(new UploadError("الرفع فشل. تأكد من الاتصال وحاول مرة تانية."));
    xhr.onabort = () => reject(new UploadError("تم إلغاء الرفع."));
    xhr.send(body);
  });
}
