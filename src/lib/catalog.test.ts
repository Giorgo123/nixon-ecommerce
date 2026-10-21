import { beforeEach, describe, expect, it, vi } from "vitest";

const product = {
  id: "p1",
  name: "Remera Oversize Test",
  description: "Remera oversize de algodón.",
  price: 41500,
  compareAtPrice: null,
  image: "/x.webp",
  videoUrl: null,
  category: "remera",
  slug: "remera-oversize-test",
  seo: null,
  isFeatured: false,
  materials: null,
  careInstructions: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  variants: [],
  images: [],
};

const findMany = vi.fn();
const findFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: { product: { findMany, findFirst } },
}));

const { getCatalogCategories, getCatalogProductBySlug, getCatalogProducts, getActiveCategoryCounts } = await import(
  "./catalog"
);

function connectionError(message = "Can't reach database server", code = "P1001") {
  return Object.assign(new Error(message), { code });
}

beforeEach(() => {
  findMany.mockReset();
  findFirst.mockReset();
});

describe("catalog reads con reintento ante fallo de conexion", () => {
  it("reintenta y devuelve los datos cuando la base se cae una vez", async () => {
    findMany
      .mockRejectedValueOnce(connectionError())
      .mockResolvedValueOnce([product]);

    const result = await getCatalogProducts();

    expect(findMany).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("remera-oversize-test");
  });

  it("reintenta tambien ante P1011 y P1017", async () => {
    for (const [message, code] of [
      ["Error opening a TLS connection: conexión interrumpida.", "P1011"],
      ["Server has closed the connection.", "P1017"],
    ] as const) {
      findMany.mockReset();
      findMany.mockRejectedValueOnce(connectionError(message, code)).mockResolvedValueOnce([product]);

      await expect(getCatalogProducts()).resolves.toHaveLength(1);
      expect(findMany).toHaveBeenCalledTimes(2);
    }
  });

  it("propaga el error si se agota el numero de intentos", async () => {
    findMany.mockRejectedValue(connectionError());

    await expect(getCatalogProducts()).rejects.toThrow("Can't reach database server");
    expect(findMany).toHaveBeenCalledTimes(3);
  });

  it("no reintenta ante errores que no son de conexion", async () => {
    findMany.mockRejectedValue(Object.assign(new Error("Unique constraint failed"), { code: "P2002" }));

    await expect(getCatalogProducts()).rejects.toThrow("Unique constraint failed");
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("aplica el reintento tambien al detalle por slug y a las categorias", async () => {
    findFirst.mockRejectedValueOnce(connectionError()).mockResolvedValueOnce(product);
    await expect(getCatalogProductBySlug("remera-oversize-test")).resolves.not.toBeNull();
    expect(findFirst).toHaveBeenCalledTimes(2);

    findMany.mockRejectedValueOnce(connectionError()).mockResolvedValueOnce([{ category: "remera" }]);
    await expect(getCatalogCategories()).resolves.toEqual(["remera"]);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});

describe("getActiveCategoryCounts", () => {
  it("solo devuelve categorias con al menos un producto activo, con su slug", async () => {
    findMany.mockResolvedValueOnce([
      { category: "remera" },
      { category: "oversize" },
      { category: "remera" },
      { category: "taza" },
    ]);

    const result = await getActiveCategoryCounts();

    expect(result).toEqual([
      { category: "remera", slug: "remeras-oversize", count: 3 },
      { category: "taza", slug: "tazas-personalizadas", count: 1 },
    ]);
  });

  it("normaliza el alias legado 'oversize' dentro de 'remera'", async () => {
    findMany.mockResolvedValueOnce([{ category: "oversize" }]);
    const result = await getActiveCategoryCounts();
    expect(result).toEqual([{ category: "remera", slug: "remeras-oversize", count: 1 }]);
  });

  it("no lista una categoria sin productos (no genera pagina indexable vacia)", async () => {
    // Solo hay productos de "remera": "buzo"/"taza"/"poster" no deben aparecer
    // en el resultado, asi generateStaticParams no crea paginas vacias.
    findMany.mockResolvedValueOnce([{ category: "remera" }]);
    const result = await getActiveCategoryCounts();
    expect(result).toEqual([{ category: "remera", slug: "remeras-oversize", count: 1 }]);
  });
});
