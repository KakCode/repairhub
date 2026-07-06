import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { validateImageFile } from "@/lib/uploadConstraints";

export async function saveUploadedFile(file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = file.type.split("/")[1];
  const filename = `${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return blob.url;
}
