import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Limpiar datos existentes
  await prisma.orderItem.deleteMany();
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

  // Crear productos de ropa
  const products = [
    {
      name: "Remera Oversize Dark Art",
      description: "Remera oversize 100% algodón con diseño dark art exclusivo. Cómoda y versátil.",
      price: 4500,
      category: "oversize",
      image: "/products/oversize/dark-art-1.jpg",
      slug: "remera-oversize-dark-art",
      stock: 15,
      seo: "remera oversize dark art negro",
    },
    {
      name: "Remera Oversize Streetwear",
      description: "Oversized fit streetwear style. Perfecta para cualquier look casual.",
      price: 4500,
      category: "oversize",
      image: "/products/oversize/streetwear-1.jpg",
      slug: "remera-oversize-streetwear",
      stock: 12,
      seo: "remera oversize streetwear",
    },
    {
      name: "Remera Regular Clásica Negra",
      description: "Remera clásica 100% algodón, corte regular, disponible en varios talles.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/clasica-negra.jpg",
      slug: "remera-regular-clasica-negra",
      stock: 25,
      seo: "remera regular negra clásica",
    },
    {
      name: "Remera Regular Blanca",
      description: "Remera básica blanca 100% algodón. Esencial para cualquier guardarropa.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/clasica-blanca.jpg",
      slug: "remera-regular-clasica-blanca",
      stock: 30,
      seo: "remera blanca básica",
    },
    {
      name: "Remera Oversize Gráfico Nixon",
      description: "Remera oversize con gráfico del logo Nixon Studio. Diseño exclusivo.",
      price: 5000,
      category: "oversize",
      image: "/products/oversize/nixon-logo.jpg",
      slug: "remera-oversize-logo-nixon",
      stock: 8,
      seo: "remera oversize logo nixon studio",
    },
    {
      name: "Remera Regular Gris",
      description: "Remera regular gris marengo. Versátil y cómoda para el día a día.",
      price: 3500,
      category: "remera",
      image: "/products/remeras/gris-marengo.jpg",
      slug: "remera-regular-gris",
      stock: 18,
      seo: "remera regular gris",
    },
    {
      name: "Remera Oversize Vintage",
      description: "Oversize fit con estilo vintage. Tela premium lavada a la piedra.",
      price: 4800,
      category: "oversize",
      image: "/products/oversize/vintage-wash.jpg",
      slug: "remera-oversize-vintage",
      stock: 10,
      seo: "remera oversize vintage",
    },
    {
      name: "Remera Regular Premium",
      description: "Remera regular premium con tela de mayor gramaje. Durabilidad garantizada.",
      price: 4200,
      category: "remera",
      image: "/products/remeras/premium-negro.jpg",
      slug: "remera-regular-premium",
      stock: 14,
      seo: "remera regular premium algodón",
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
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

