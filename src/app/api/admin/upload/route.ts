import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminSessionActive } from "@/lib/admin-session";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const imageContentTypes = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const videoContentTypes = ["video/mp4", "video/webm"];

// Sube directo del navegador a Vercel Blob (no pasa el archivo por esta
// funcion serverless): Vercel corta el body de cualquier request a una
// funcion en ~4.5MB, asi que subir el archivo posta por ahi rompia fotos
// medianas y CUALQUIER video (413 "Request Entity Too Large" en texto
// plano, no JSON - de ahi el "Unexpected token 'R'" que se ve en el admin).
// Esta ruta solo emite un token firmado de corta duracion; el archivo viaja
// directo del navegador al storage.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await isAdminSessionActive())) {
          throw new Error("No autorizado");
        }

        const isVideo = clientPayload === "video";

        return {
          allowedContentTypes: isVideo ? videoContentTypes : imageContentTypes,
          maximumSizeInBytes: isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar el token de subida" },
      { status: 400 }
    );
  }
}
