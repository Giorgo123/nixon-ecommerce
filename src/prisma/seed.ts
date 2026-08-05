import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Distribucion tipica de talles para prendas (S/M/L mas fuertes que XS/XXL).
function sizedVariants(stockBySize: Partial<Record<"S" | "M" | "L" | "XL" | "XXL", number>>) {
  return Object.entries(stockBySize).map(([size, stock]) => ({ size, stock: stock ?? 0 }));
}

async function main() {
  console.log("🌱 Seeding database...");

  // Limpiar datos existentes
  await prisma.orderItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.admin.deleteMany();

  // Crear admin default (usa ADMIN_EMAIL/ADMIN_PASSWORD si están seteadas)
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nixonstudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  await prisma.admin.create({
    data: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      name: "Admin Nixon",
    },
  });

  // Productos con talle (remera, oversize, buzo)
  const sizedProducts = [
    {
      name: "Remera Oversize Dark Art",
      description: "Remera oversize 100% algodón con diseño dark art exclusivo. Cómoda y versátil.",
      price: 4500,
      category: "oversize",
      image: "/products/oversize/dark-art-1.jpg",
      slug: "remera-oversize-dark-art",
      seo: "remera oversize dark art negro",
      variants: sizedVariants({ S: 2, M: 4, L: 4, XL: 3, XXL: 2 }),
    },
    {
      name: "Remera Oversize Streetwear",
      description: "Oversized fit streetwear style. Perfecta para cualquier look casual.",
      price: 4500,
      category: "oversize",
      image: "/products/oversize/streetwear-1.jpg",
      slug: "remera-oversize-streetwear",
      seo: "remera oversize streetwear",
      variants: sizedVariants({ S: 2, M: 3, L: 3, XL: 2, XXL: 2 }),
    },
    {
      name: "Remera Regular Clásica Negra",
      description: "Remera clásica 100% algodón, corte regular, disponible en varios talles.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/clasica-negra.jpg",
      slug: "remera-regular-clasica-negra",
      seo: "remera regular negra clásica",
      variants: sizedVariants({ S: 4, M: 7, L: 7, XL: 4, XXL: 3 }),
    },
    {
      name: "Remera Regular Blanca",
      description: "Remera básica blanca 100% algodón. Esencial para cualquier guardarropa.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/clasica-blanca.jpg",
      slug: "remera-regular-clasica-blanca",
      seo: "remera blanca básica",
      variants: sizedVariants({ S: 5, M: 8, L: 8, XL: 5, XXL: 4 }),
    },
    {
      name: "Remera Oversize Gráfico Nixon",
      description: "Remera oversize con gráfico del logo Nixon Studio. Diseño exclusivo.",
      price: 5000,
      category: "oversize",
      image: "/products/oversize/nixon-logo.jpg",
      slug: "remera-oversize-logo-nixon",
      seo: "remera oversize logo nixon studio",
      variants: sizedVariants({ S: 1, M: 2, L: 2, XL: 2, XXL: 1 }),
    },
    {
      name: "Remera Regular Gris",
      description: "Remera regular gris marengo. Versátil y cómoda para el día a día.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/gris-marengo.jpg",
      slug: "remera-regular-gris",
      seo: "remera regular gris",
      variants: sizedVariants({ S: 3, M: 5, L: 5, XL: 3, XXL: 2 }),
    },
    {
      name: "Remera Oversize Vintage",
      description: "Oversize fit con estilo vintage. Tela premium lavada a la piedra.",
      price: 4800,
      category: "oversize",
      image: "/products/oversize/vintage-wash.jpg",
      slug: "remera-oversize-vintage",
      seo: "remera oversize vintage",
      variants: sizedVariants({ S: 2, M: 2, L: 3, XL: 2, XXL: 1 }),
    },
    {
      name: "Remera Regular Premium",
      description: "Remera regular premium con tela de mayor gramaje. Durabilidad garantizada.",
      price: 4200,
      category: "remera",
      image: "/products/remeras/premium-negro.jpg",
      slug: "remera-regular-premium",
      seo: "remera regular premium algodón",
      variants: sizedVariants({ S: 2, M: 4, L: 4, XL: 2, XXL: 2 }),
    },
    {
      name: "Buzo Oversize Negro",
      description: "Buzo oversize con friza interior. Ideal para el invierno de Córdoba.",
      price: 7500,
      category: "buzo",
      image: "/products/buzos/oversize-negro.jpg",
      slug: "buzo-oversize-negro",
      seo: "buzo oversize negro friza",
      variants: sizedVariants({ S: 2, M: 4, L: 4, XL: 3, XXL: 2 }),
    },
  ];

  // Productos sin talle (una sola variante "talle único")
  const singleVariantProducts = [
    {
      name: "Taza Personalizada Nixon",
      description: "Taza cerámica personalizada con diseño Nixon Studio.",
      price: 3000,
      category: "taza",
      image: "/products/tazas/nixon.jpg",
      slug: "taza-personalizada-nixon",
      seo: "taza personalizada nixon studio",
      variants: [{ stock: 20 }],
    },
    {
      name: "Poster de Aluminio Dark Art",
      description: "Poster de aluminio con acabado premium, diseño dark art.",
      price: 6000,
      category: "poster",
      image: "/products/posters/dark-art.jpg",
      slug: "poster-de-aluminio-dark-art",
      seo: "poster aluminio dark art",
      variants: [{ stock: 10 }],
    },
  ];

  const products = [...sizedProducts, ...singleVariantProducts];

  for (const { variants, ...product } of products) {
    await prisma.product.create({
      data: { ...product, variants: { create: variants } },
    });
  }

  console.log("✅ Seeding completado");
  console.log(`📦 ${products.length} productos creados`);
  console.log(`👤 Admin creado: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error("❌ Error seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
