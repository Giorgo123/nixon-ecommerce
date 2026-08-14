import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdminSessionActive } from "@/lib/admin-session";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const extensionByMimeType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const videoMimeTypes = new Set(["video/mp4", "video/webm"]);

export async function POST(request: NextRequest) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const extension = extensionByMimeType[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: "El archivo debe ser una imagen (png, jpg, webp, avif o gif) o un video (mp4, webm)" },
      { status: 400 }
    );
  }

  const isVideo = videoMimeTypes.has(file.type);
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "El video no puede superar los 50MB" : "La imagen no puede superar los 8MB" },
      { status: 400 }
    );
  }

  const blob = await put(`products/${crypto.randomUUID()}.${extension}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
