import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/features/products/types";

interface CrossSellProps {
  products: Product[];
}

export default function CrossSell({ products }: CrossSellProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-black/10 pt-10 dark:border-white/10">
      <h2 className="text-xl font-black tracking-tight text-black dark:text-white sm:text-2xl">
        También te puede gustar
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
