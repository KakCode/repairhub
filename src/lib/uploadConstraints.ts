export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_MB = 8;
export const UPLOAD_HINT = "JPG, PNG, WEBP, or GIF — max 8MB";

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported file type. Use JPG, PNG, WEBP, or GIF.";
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File is too large. Max size is ${MAX_UPLOAD_SIZE_MB}MB.`;
  }
  return null;
}
