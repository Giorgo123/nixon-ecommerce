-- Soft-delete para Product: permite ocultar un producto de la tienda sin
-- borrar la fila, porque borrarla en cascada rompe la FK de OrderItem ->
-- ProductVariant cuando el producto tuvo pedidos.
ALTER TABLE "Product" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
