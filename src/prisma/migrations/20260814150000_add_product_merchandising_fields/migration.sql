-- Campos aditivos de merchandising: precio comparado (badge de descuento),
-- video de producto, producto destacado en el hero, y textos de
-- composicion/cuidado. Todos opcionales o con default, no rompen filas
-- existentes.
ALTER TABLE "Product" ADD COLUMN "compareAtPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "materials" TEXT;
ALTER TABLE "Product" ADD COLUMN "careInstructions" TEXT;
