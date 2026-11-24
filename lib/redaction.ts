/**
 * Client-Side PII Redaction and Image Compression Pipeline.
 * Runs completely in the citizen's browser (DPDP Act 2023 compliant).
 * Original unredacted image never leaves the client device.
 */

export interface PIIRegion {
  type: "aadhaar" | "pan" | "phone";
  match: string;
  start: number;
  end: number;
}

const AADHAAR_REGEX = /\b(\d{4}\s?\d{4}\s?\d{4})\b/g;
const PAN_REGEX = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/g;
const PHONE_REGEX = /(?:\+91[\s-]?)?\b([6-9]\d{9})\b/g;

export function findPIIRegions(text: string): PIIRegion[] {
  const regions: PIIRegion[] = [];

  // Find Aadhaar matches
  let match: RegExpExecArray | null;
  const aadhaarRegex = new RegExp(AADHAAR_REGEX);
  while ((match = aadhaarRegex.exec(text)) !== null) {
    regions.push({
      type: "aadhaar",
      match: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Find PAN matches
  const panRegex = new RegExp(PAN_REGEX);
  while ((match = panRegex.exec(text)) !== null) {
    regions.push({
      type: "pan",
      match: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Find Phone matches (excluding any that overlap with already matched Aadhaar/PAN)
  const phoneRegex = new RegExp(PHONE_REGEX);
  while ((match = phoneRegex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const overlaps = regions.some(
      (r) => (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
    );
    if (!overlaps) {
      regions.push({
        type: "phone",
        match: match[0],
        start,
        end,
      });
    }
  }

  return regions;
}

export function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\s/g, "");
  if (clean.length === 12) {
    return `XXXX XXXX ${clean.slice(8)}`;
  }
  return aadhaar;
}

export interface RedactionBox {
  x: number; // 0..1 normalized coordinate relative to image width
  y: number; // 0..1 normalized coordinate relative to image height
  width: number;
  height: number;
}

export interface RedactCompressOptions {
  maxSizeKb?: number;
  quality?: number;
  masks?: RedactionBox[];
}

export interface RedactCompressResult {
  base64: string;
  redactedCount: number;
  finalSizeKb: number;
}

export async function redactAndCompress(
  imageSource: File | Blob | HTMLCanvasElement,
  options: RedactCompressOptions = {}
): Promise<RedactCompressResult> {
  const maxSizeKb = options.maxSizeKb ?? 800;
  let quality = options.quality ?? 0.85;
  const masks = options.masks || [];

  return new Promise((resolve, reject) => {
    // Check browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      return resolve({
        base64: "",
        redactedCount: 0,
        finalSizeKb: 0,
      });
    }

    const processCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      // Permanently destroy masked pixels by painting solid black boxes
      if (masks.length > 0) {
        ctx.fillStyle = "#000000";
        for (const m of masks) {
          const rx = Math.max(0, m.x * canvas.width);
          const ry = Math.max(0, m.y * canvas.height);
          const rw = Math.min(canvas.width - rx, m.width * canvas.width);
          const rh = Math.min(canvas.height - ry, m.height * canvas.height);
          ctx.fillRect(rx, ry, rw, rh);
        }
      }

      // Check image data and apply compression
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      let sizeInKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));

      // Iteratively reduce quality if file is larger than maxSizeKb
      while (sizeInKb > maxSizeKb && quality > 0.3) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        sizeInKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
      }

      resolve({
        base64: dataUrl,
        redactedCount: masks.length,
        finalSizeKb: sizeInKb,
      });
    };

    if (typeof HTMLCanvasElement !== "undefined" && imageSource instanceof HTMLCanvasElement) {
      const ctx = imageSource.getContext("2d");
      if (!ctx) return reject(new Error("Unable to initialize canvas context"));
      return processCanvas(imageSource, ctx);
    }

    const objectUrl = URL.createObjectURL(imageSource as Blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Create off-screen canvas
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Scale down large images (max 1600px dimension)
      const MAX_DIMENSION = 1600;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Unable to initialize canvas context"));
      }

      // Draw initial image
      ctx.drawImage(img, 0, 0, width, height);
      processCanvas(canvas, ctx);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for processing: " + err));
    };

    img.src = objectUrl;
  });
}
