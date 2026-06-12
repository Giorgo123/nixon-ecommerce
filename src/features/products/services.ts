import axios from "axios";
import type { Product } from "@/features/products/types";

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await axios.get<Product[]>("/api/products");
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await axios.get<Product>(`/api/products?slug=${slug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  try {
    const response = await axios.post("/api/products", data);
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}
