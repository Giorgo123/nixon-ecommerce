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
      <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4">
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
