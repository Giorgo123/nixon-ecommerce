import prisma from "@/lib/prisma";
import { getCatalogProducts } from "@/lib/catalog";

export async function syncCatalogProductsToDb() {
  const products = getCatalogProducts();
  const syncedProducts = [];

  for (const product of products) {
    const dbProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
        seo: product.seo,
      },
      create: {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
        slug: product.slug,
        seo: product.seo,
      },
    });

    syncedProducts.push({ localId: product.id, ...dbProduct });
  }

  return syncedProducts;
}

export async function createPendingOrder(input: {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{ id: string; quantity: number }>;
}) {
  const syncedProducts = await syncCatalogProductsToDb();
  const productMap = new Map(syncedProducts.map((product) => [product.localId, product]));

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.id);
    if (!product) {
      throw new Error("Producto inválido");
    }

    return {
      quantity: item.quantity,
      price: product.price,
      productId: product.id,
    };
  });

  const totalPrice = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return prisma.order.create({
    data: {
      email: input.customer.email,
      fullName: input.customer.fullName,
      phone: input.customer.phone,
      address: input.customer.address,
      city: input.customer.city,
      state: input.customer.state,
      zipCode: input.customer.zipCode,
      totalPrice,
      status: "pending",
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}
