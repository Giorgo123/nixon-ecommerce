import prisma from "@/lib/prisma";

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
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.id) } },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

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
