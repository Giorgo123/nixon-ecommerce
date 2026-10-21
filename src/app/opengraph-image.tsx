import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// Imagen Open Graph por defecto: se usa cuando una pagina no define la suya
// (home, categorias, legales). La PDP ya arma su propia imagen con la foto del
// producto. Next la expone en /opengraph-image y el `defaultOpenGraph()` de
// src/lib/seo.ts apunta ahi.
//
// Sin claims: solo marca y una linea de contexto real (remeras oversize), que
// ya es el posicionamiento declarado en product.md/README. No se afirma envio,
// cuotas ni nada comercial para no contradecir el copy oficial.
export const alt = `${SITE_NAME} — Remeras Oversize`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0d0d0d",
          padding: "96px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "12px",
            backgroundColor: "#dc2626",
          }}
        />
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#dc2626",
            fontWeight: 700,
            display: "flex",
          }}
        >
          Streetwear · Dark Art
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 900,
            color: "#ffffff",
            marginTop: 24,
            lineHeight: 1.05,
            display: "flex",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "#9ca3af",
            marginTop: 20,
            display: "flex",
          }}
        >
          Remeras oversize estampadas
        </div>
      </div>
    ),
    { ...size }
  );
}
