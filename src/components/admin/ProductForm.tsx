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

export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? "remera");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [seo, setSeo] = useState(product?.seo ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : (product?.image ?? null));
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
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          const payload = (await uploadResponse.json()) as { error?: string };
          throw new Error(payload.error ?? "No se pudo subir la imagen");
        }

        const uploadResult = (await uploadResponse.json()) as { url: string };
        imageUrl = uploadResult.url;
      }

      const payload = {
        name,
        description,
        price: parseFloat(price),
        image: imageUrl,
        category,
        stock: parseInt(stock, 10) || 0,
        seo: seo || undefined,
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className={labelClasses} htmlFor="stock">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                className={inputClasses}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </div>
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
            <label className={labelClasses} htmlFor="seo">SEO (opcional)</label>
            <input
              id="seo"
              className={inputClasses}
              value={seo}
              onChange={(event) => setSeo(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses} htmlFor="image">Imagen</label>
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
