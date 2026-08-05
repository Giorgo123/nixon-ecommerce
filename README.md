# Nixon Studio — Ecommerce

Tienda online de indumentaria urbana/streetwear (remeras, buzos oversize, tazas, posters), operada desde Villa María, Córdoba, Argentina, con envío gratuito a todo el país.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [Prisma](https://www.prisma.io/) + PostgreSQL (Railway)
- [Zustand](https://zustand-demo.pmnd.rs/) para el carrito (persistido en `localStorage`)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Mercado Pago](https://www.mercadopago.com.ar/) (Checkout Pro) para pagos
- [Resend](https://resend.com/) para emails transaccionales
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para las imágenes de producto que sube el admin

Deploy en [Vercel](https://vercel.com/).

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar con credenciales reales
npx prisma generate
npm run dev
```

El sitio queda en `http://localhost:3000`. El panel de admin está en `/admin/login`.

### Base de datos

```bash
npx prisma migrate deploy   # aplicar migraciones a una base existente
npx prisma db seed          # solo en una base nueva/de desarrollo: crea el admin y productos de ejemplo
```

⚠️ `prisma db seed` borra `Product`, `Order`, `OrderItem` y `Admin` antes de recrearlos — no correrlo contra una base con pedidos reales.

### Variables de entorno

Ver `.env.example` para la lista completa. Las críticas para que el sitio funcione:

- `DATABASE_URL` — conexión a Postgres
- `SESSION_SECRET` — firma las sesiones de admin y los tokens de acceso a `/success`
- `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET` — checkout y confirmación de pagos
- `BLOB_READ_WRITE_TOKEN` — subida de imágenes desde el admin

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Chequeo de tipos |
