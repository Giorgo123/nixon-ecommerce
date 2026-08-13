"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels, productCategories } from "@/lib/categories";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

const inputClasses =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40";
const labelClasses = "text-sm font-medium text-black/80 dark:text-white/80";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const SIZED_CATEGORIES = new Set(["remera", "oversize", "buzo"]);

interface GalleryItem {
  key: string;
  url?: string; // ya subida (existente)
  file?: File; // pendiente de subir
  preview: string;
}

function initialSizeStocks(product?: Product): Record<string, string> {
  const base = Object.fromEntries(SIZES.map((size) => [size, "0"]));
  if (!product) return base;
  for (const variant of product.variants) {
    if (variant.size && SIZES.includes(variant.size as (typeof SIZES)[number])) {
      base[variant.size] = variant.stock.toString();
    }
  }
  return base;
}

function initialSingleStock(product?: Product): string {
  const defaultVariant = product?.variants.find((v) => !v.size);
  return (defaultVariant?.stock ?? 0).toString();
}

async function uploadImage(file: File): Promise<string> {
  const uploadData = new FormData();
  uploadData.append("file", file);

  const uploadResponse = await fetch("/api/admin/upload", {
    method: "POST",
    body: uploadData,
  });

  if (!uploadResponse.ok) {
    const payload = (await uploadResponse.json()) as { error?: string };
    throw new Error(payload.error ?? "No se pudo subir la imagen");
  }

  const uploadResult = (await uploadResponse.json()) as { url: string };
  return uploadResult.url;
}

export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? "remera");
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>(() => initialSizeStocks(product));
  const [singleStock, setSingleStock] = useState(() => initialSingleStock(product));
  const [seo, setSeo] = useState(product?.seo ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);
  const [gallery, setGallery] = useState<GalleryItem[]>(
    () => (product?.images ?? []).map((url, i) => ({ key: `existing-${i}`, url, preview: url }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSizes = SIZED_CATEGORIES.has(category);

  function handleFileChange(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : (product?.image ?? null));
  }

  function handleGalleryFilesAdded(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newItems: GalleryItem[] = Array.from(files).map((file) => ({
      key: `new-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setGallery((prev) => [...prev, ...newItems]);
  }

  function removeGalleryItem(key: string) {
    setGallery((prev) => prev.filter((item) => item.key !== key));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "create" && !imageFile) {
      setError("Seleccioná una imagen para el producto");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = product?.image ?? "";

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const galleryUrls: string[] = [];
      for (const item of gallery) {
        galleryUrls.push(item.url ?? (await uploadImage(item.file as File)));
      }

      const variants = hasSizes
        ? SIZES.map((size) => ({ size, stock: parseInt(sizeStocks[size], 10) || 0 }))
        : [{ size: null, stock: parseInt(singleStock, 10) || 0 }];

      const payload = {
        name,
        description,
        price: parseFloat(price),
        image: imageUrl,
        category,
        seo: seo || undefined,
        variants,
        images: galleryUrls,
      };

      const response = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responsePayload = (await response.json()) as { error?: string };
        throw new Error(responsePayload.error ?? "No se pudo guardar el producto");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={labelClasses} htmlFor="name">Nombre</label>
            <input
              id="name"
              className={inputClasses}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="description">Descripción</label>
            <textarea
              id="description"
              className={inputClasses}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="price">Precio</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className={inputClasses}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="category">Categoría</label>
            <select
              id="category"
              className={inputClasses}
              value={category}
              onChange={(event) => setCategory(event.target.value as Product["category"])}
            >
              {productCategories.map((value) => (
                <option key={value} value={value}>
                  {catalogCategoryLabels[value] ?? value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className={labelClasses}>Stock {hasSizes ? "por talle" : ""}</span>
            {hasSizes ? (
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <div key={size} className="space-y-1">
                    <label className="text-xs text-black/60 dark:text-white/60" htmlFor={`stock-${size}`}>
                      {size}
                    </label>
                    <input
                      id={`stock-${size}`}
                      type="number"
                      min="0"
                      className={inputClasses}
                      value={sizeStocks[size]}
                      onChange={(event) =>
                        setSizeStocks((prev) => ({ ...prev, [size]: event.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <input
                id="single-stock"
                type="number"
                min="0"
                className={inputClasses}
                value={singleStock}
                onChange={(event) => setSingleStock(event.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="seo">SEO (opcional)</label>
            <input
              id="seo"
              className={inputClasses}
              value={seo}
              onChange={(event) => setSeo(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className={labelClasses} htmlFor="image">Imagen de portada</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className={inputClasses}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Vista previa"
                className="mt-3 aspect-square w-full max-w-xs rounded-2xl border border-black/10 object-cover dark:border-white/10"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="gallery">Galería (fotos adicionales)</label>
            <input
              id="gallery"
              type="file"
              accept="image/*"
              multiple
              className={inputClasses}
              onChange={(event) => {
                handleGalleryFilesAdded(event.target.files);
                event.target.value = "";
              }}
            />
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {gallery.map((item) => (
                  <div key={item.key} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt="Foto de galería" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(item.key)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {loading ? "Guardando..." : mode === "create" ? "Crear producto" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
