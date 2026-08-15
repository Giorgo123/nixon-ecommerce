"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/features/products/types";
import { catalogCategoryLabels, productCategories } from "@/lib/categories";
import { isSizedCategory } from "@/lib/constants/commerce-copy";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

const inputClasses =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/40 focus:border-red-500 focus:outline-none dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/40";
const labelClasses = "text-sm font-medium text-black/80 dark:text-white/80";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

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
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? "remera");
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>(() => initialSizeStocks(product));
  const [singleStock, setSingleStock] = useState(() => initialSingleStock(product));
  const [seo, setSeo] = useState(product?.seo ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [materials, setMaterials] = useState(product?.materials ?? "");
  const [careInstructions, setCareInstructions] = useState(product?.careInstructions ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(product?.videoUrl);
  const [gallery, setGallery] = useState<GalleryItem[]>(
    () => (product?.images ?? []).map((url, i) => ({ key: `existing-${i}`, url, preview: url }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSizes = isSizedCategory(category);

  // Tildar un talle lo marca disponible con una cantidad por defecto que se
  // puede ajustar al lado; destildarlo lo deja en 0 (sin stock). Pensado
  // para carga rapida: "tildar lo que hay y listo", sin tener que pensar un
  // numero exacto para cada talle si no hace falta.
  function toggleSize(size: string, available: boolean) {
    setSizeStocks((prev) => ({ ...prev, [size]: available ? "1" : "0" }));
  }

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

  function moveGalleryItem(key: string, direction: -1 | 1) {
    setGallery((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        finalVideoUrl = await uploadImage(videoFile);
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
        compareAtPrice: compareAtPrice.trim() ? parseFloat(compareAtPrice) : undefined,
        image: imageUrl,
        videoUrl: finalVideoUrl || undefined,
        category,
        seo: seo || undefined,
        isFeatured,
        materials: materials.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
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

          <div className="grid grid-cols-2 gap-3">
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
              <label className={labelClasses} htmlFor="compareAtPrice">Precio anterior (opcional)</label>
              <input
                id="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                className={inputClasses}
                value={compareAtPrice}
                onChange={(event) => setCompareAtPrice(event.target.value)}
                placeholder="Para mostrar % OFF"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-black/80 dark:text-white/80">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="h-4 w-4 accent-red-500"
            />
            Producto estrella (aparece en el slider del hero)
          </label>

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
            <span className={labelClasses}>{hasSizes ? "Talles disponibles" : "Unidades disponibles"}</span>
            {hasSizes ? (
              <div className="space-y-2">
                {SIZES.map((size) => {
                  const stock = parseInt(sizeStocks[size], 10) || 0;
                  const available = stock > 0;
                  return (
                    <div key={size} className="flex items-center gap-3">
                      <label className="flex w-24 items-center gap-2 text-sm text-black dark:text-white">
                        <input
                          type="checkbox"
                          checked={available}
                          onChange={(event) => toggleSize(size, event.target.checked)}
                          className="h-4 w-4 accent-red-500"
                        />
                        Talle {size}
                      </label>
                      {available && (
                        <input
                          type="number"
                          min="1"
                          aria-label={`Unidades disponibles talle ${size}`}
                          className={`${inputClasses} w-28`}
                          value={sizeStocks[size]}
                          onChange={(event) =>
                            setSizeStocks((prev) => ({ ...prev, [size]: event.target.value }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
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

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="materials">Composición / materiales (opcional)</label>
            <textarea
              id="materials"
              className={inputClasses}
              rows={2}
              value={materials}
              onChange={(event) => setMaterials(event.target.value)}
              placeholder="Ej: 100% Algodón peinado 24/1 de alto gramaje..."
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="careInstructions">Cuidados (opcional)</label>
            <textarea
              id="careInstructions"
              className={inputClasses}
              rows={2}
              value={careInstructions}
              onChange={(event) => setCareInstructions(event.target.value)}
              placeholder="Ej: Lavar con agua fría del revés, no planchar sobre la estampa."
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
                {gallery.map((item, index) => (
                  <div key={item.key} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt="Foto de galería" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-1 top-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveGalleryItem(item.key, -1)}
                          disabled={index === 0}
                          className="rounded-full bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white disabled:opacity-30"
                          aria-label="Mover antes"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryItem(item.key, 1)}
                          disabled={index === gallery.length - 1}
                          className="rounded-full bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white disabled:opacity-30"
                          aria-label="Mover después"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(item.key)}
                        className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClasses} htmlFor="video">Video de producto (opcional, mp4 o webm)</label>
            <input
              id="video"
              type="file"
              accept="video/mp4,video/webm"
              className={inputClasses}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setVideoFile(file);
                if (file) setVideoUrl(undefined);
              }}
            />
            {(videoFile || videoUrl) && (
              <p className="text-xs text-black/60 dark:text-white/60">
                {videoFile ? videoFile.name : "Video actual cargado"}
                {videoUrl && !videoFile && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl(undefined)}
                    className="ml-2 text-red-500 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </p>
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
