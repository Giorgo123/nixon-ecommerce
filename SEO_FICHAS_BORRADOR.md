# BORRADOR — Propuestas de fichas de producto (NO cargar sin aprobación)

> **Estado:** borrador local para revisión. **NO** se cargó nada en la base de
> datos (ni local, ni Neon, ni Production). Nada de lo de acá está en el sitio.
>
> **Cómo aprobarlo:** marcá cada fila con `[x]` (o editala libremente) y avisame
> cuáles querés cargar. Recién ahí las cargo desde `/admin/products`, de a una,
> sin tocar precios, stock ni imágenes.
>
> **Origen de los datos:** únicamente el contenido real ya cargado de cada
> producto (nombre, categoría, color y nº de drop que ya están en el nombre,
> `materials` cuando existe) + hechos de negocio ya verificados en
> `product.md`, `design.md` y `src/lib/constants/commerce-copy.ts`
> (algodón peinado 24/1, estampa DTF, envío gratis a todo el país, cuotas en
> vivo con Mercado Pago). **No** se inventó composición, medidas, color,
> técnica de estampa, disponibilidad, plazos, descuentos ni reseñas.

---

## Qué se propone y por qué

1. **`seo` (meta description real):** hoy 8 productos lo tienen **vacío** y el
   resto tiene una palabra suelta ("Rock Lee", "Itachi Uchiha"), no una
   descripción. El campo `seo` es justamente el que Google usa como resumen
   (`product.seo || product.description` en `src/app/products/[slug]/page.tsx:52`).
   Sin esto, Google muestra el texto emoji de envío como descripción.
2. **`description` (texto visible en la ficha):** hoy son **idénticas en los 28
   productos** (mismo texto genérico de envío/materiales). Eso es contenido
   duplicado a nivel sitio y no aporta nada específico del producto. Se propone
   una descripción propia por producto (qué personaje/diseño es, en qué formato
   viene), **sin afirmar nada que no esté ya en el nombre del producto**.
3. **`materials`:** 26 de 28 lo tienen vacío. Se propone completarlo con el
   texto ya aprobado en `commerce-copy.ts` (no un dato nuevo), para que la ficha
   muestre composición en vez de un campo vacío.
4. **`careInstructions`:** vacío en los 28. Mismo texto aprobado ya existente.

**Límite importante:** no sé — y no voy a suponer — la **técnica de estampa real
por producto** (serigrafía vs DTF semitono vs DTF textil). El nombre y el campo
genérico actual mezclan variantes. Por eso las descripciones propuestas **no
nombran técnica de estampa**; si querés incluirla, decime qué técnica real usa
cada uno y la agrego. Tampoco conozco colores que no estén en el nombre, ni
medidas (la guía de talles ya vive aparte en la ficha).

---

## Bloque A — Productos con `seo` VACÍO hoy (prioridad alta: 6 productos)

Estos hoy no tienen meta description propia → Google usa el texto emoji.

| # | slug | Título SEO propuesto (name, sin cambios) | `seo` (meta description) propuesto | ¿Aprobado? |
|---|---|---|---|---|
| 21 | `remera-oversize-blanca-akaza-demon-slayer-droop-24-edicion-limitada` | Remera Oversize blanca Akaza Demon Slayer — Droop #24 Edición Limitada | Remera oversize Akaza (Demon Slayer), Droop #24 edición limitada. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 23 | `remera-oversize-toji-fushiguro-droop-31` | Remera Oversize Toji Fushiguro — Droop #31 | Remera oversize Toji Fushiguro (Jujutsu Kaisen), Droop #31. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 24 | `remera-oversize-negra-anime-itachi-uchiha-nixon-droop-1-edicion-limitada` | Remera Oversize Negra Anime Itachi Uchiha — Nixon Droop #1 Edición Limitada | Remera oversize negra Itachi Uchiha (Naruto), Nixon Droop #1 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 25 | `remera-oversize-mike-mentzer-droop-18-edicion-limitada` | Remera Oversize Mike Mentzer — Droop #18 Edición Limitada | Remera oversize Mike Mentzer, Droop #18 edición limitada. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 26 | `remera-oversize-zoro-one-piece-droop-25` | Remera Oversize Zoro One Piece — Droop #25 | Remera oversize Zoro (One Piece), Droop #25. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 27 | `remera-oversize-vampire-hunter-d-droop-19-edicion-limitada` | Remera Oversize Vampire Hunter D — Droop #19 Edición Limitada | Remera oversize Vampire Hunter D, Droop #19 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |

> Nota idx 21: el slug dice "blanca" y el nombre lo confirma → se mantiene
> "blanca". No agrego color a los demás porque el nombre no lo especifica.

## Bloque B — Productos con `seo` = palabra suelta (mejora: 22 productos)

Hoy el `seo` es solo el nombre del personaje ("Rock Lee", "Itachi Uchiha",
"Remera Oversize Guts de Berserk"...). Se propone reemplazarlo por una meta
description completa.

| # | slug | `seo` (meta description) propuesto | ¿Aprobado? |
|---|---|---|---|
| 1 | `remera-oversize-negra-rock-lee-nixon-droop-37-edicion-limitada` | Remera oversize negra Rock Lee (Naruto), Nixon Droop #37 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 2 | `remera-oversize-guts-de-berserk-droop-45-edicion-2` | Remera oversize Guts de Berserk, Droop #45 edición 2. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 3 | `remera-oversize-bankai-droop-34` | Remera oversize Bankai, Droop #34. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 4 | `remera-oversize-alucard-hellsing-droop-33` | Remera oversize Alucard (Hellsing), Droop #33. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 5 | `remera-oversize-negra-lord-escanor-nixon-droop-5-edicion-limitada` | Remera oversize negra Lord Escanor (Nanatsu no Taizai), Nixon Droop #5 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 6 | `remera-oversize-gambito-xmen94-droop-30` | Remera oversize Gambito (X-Men '94), Droop #30. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 7 | `remera-oversize-asta-de-black-clover-droop-9-edicion-limitada` | Remera oversize Asta de Black Clover, Droop #9 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 8 | `remera-oversize-negra-kaneki-ken-nixon-droop-4-edicion-limitada` | Remera oversize negra Kaneki Ken (Tokyo Ghoul), Nixon Droop #4 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 9 | `remera-oversize-blanca-eric-draven-the-crow-1994-droop-21-edicion-limitada` | Remera oversize blanca Eric Draven (The Crow, 1994), Droop #21 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 10 | `remera-oversize-eric-draven-the-crow-1994-droop-20-edicion-limitada` | Remera oversize Eric Draven (The Crow, 1994), Droop #20 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 11 | `remera-oversize-mike-tyson-droop-14-edicion-limitada` | Remera oversize Mike Tyson, Droop #14 edición limitada. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 12 | `remera-oversize-meliodas-nanatsu-no-taisa-droop-36` | Remera oversize Meliodas (Nanatsu no Taizai), Droop #36. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 13 | `remera-oversize-negra-qin-shi-huang-nixon-droop-2-edicion-limitada` | Remera oversize negra Qin Shi Huang, Nixon Droop #2 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 14 | `remera-oversize-negra-satoru-gojo-nixon-droop-3-edicion-limitada` | Remera oversize negra Satoru Gojo (Jujutsu Kaisen), Nixon Droop #3 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 15 | `remera-oversize-peter-parker-spiderman-droop-35` | Remera oversize Peter Parker (Spider-Man), Droop #35. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 16 | `oversize-negra-touka-kirishima-nixon-droop-6-edicion-limitada` | Remera oversize negra Touka Kirishima (Tokyo Ghoul), Nixon Droop #6 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 17 | `remera-oversize-yami-black-clover-droop-26` | Remera oversize Yami Sukehiro (Black Clover), Droop #26. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 18 | `remera-oversize-blanca-sung-jin-woo-solo-leveling-droop-22-edicion-limitada` | Remera oversize blanca Sung Jin-woo (Solo Leveling), Droop #22 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 19 | `remera-oversize-sung-jin-woo-droop-7-edicion-limitada` | Remera oversize Sung Jin-woo (Solo Leveling), Droop #7 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 20 | `remera-oversize-suguru-droop-17-edicion-limitada` | Remera oversize Suguru Geto (Jujutsu Kaisen), Droop #17 edición limitada. Algodón peinado 24/1, todos los talles. Envío gratis a todo el país. | [ ] |
| 22 | `remera-oversize-guts-de-berserk-droop-11-edicion-limitada` | Remera oversize Guts de Berserk, Droop #11 edición limitada. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |
| 28 | `remera-oversize-itachi-droop-8-edicion-2` | Remera oversize Itachi Uchiha (Naruto), Droop #8 edición 2. Algodón peinado 24/1 de alto gramaje, todos los talles. Envío gratis a todo el país. | [ ] |

> idx 28: hoy su `seo` dice "Itachi Uchiha" y el nombre dice solo "Itachi".
> La propuesta usa "Itachi Uchiha" (ya presente en el `seo` actual del producto,
> no un dato nuevo).

---

## Propuesta de `description` única por producto (texto visible de la ficha)

**Por qué:** hoy los 28 comparten el mismo texto de emoji. Google lo interpreta
como contenido duplicado y al comprador no le dice nada del diseño puntual.

**Plantilla propuesta** (reemplaza el texto emoji; el detalle real de envío,
talles, materiales y cuidados ya vive en los acordeones de la ficha y en la barra
de promo, así que no se pierde información):

```
Remera oversize <nombre del diseño> — Droop #<N><, edición limitada si aplica>.
Calce oversize, unisex. Algodón peinado 24/1 de alto gramaje. Estampado
de alta densidad. Todos los talles. Envío gratis a todo el país y cuotas
sin interés con tarjetas participantes, calculadas en vivo con Mercado Pago.
```

> **Pendiente de tu dato real:** la frase **"Estampado de alta densidad"** sale
> de `commerce-copy.ts` (texto ya aprobado). Si preferís nombrar la técnica
> exacta por producto (serigrafía / DTF semitono / DTF textil), pasame la
> técnica real de cada uno y ajusto la plantilla. **No la invento.**

**¿Aprobás la plantilla de descripción?** [ ] Sí, aplicar a los 28 · [ ] No, la ajusto abajo

---

## Propuesta de `materials` y `careInstructions` (rellenar los vacíos)

Para los 26 productos sin `materials` propio, usar exactamente el texto ya
aprobado de `commerce-copy.ts` (no es dato nuevo):

- **`materials`:** `100% Algodón peinado 24/1 de alto gramaje, cuello cerrado de ribb 1x1, estampa serigráfica de alta densidad tacto cero.`
- **`careInstructions`:** `Lavar con agua fría del revés, no planchar sobre la estampa.`

> Ojo: el texto de `materials` aprobado dice "estampa serigráfica", pero el
> texto genérico actual de varios productos menciona "DTF". Si la técnica real
> no es serigrafía, **no** hay que cargar este texto. Decime qué corresponde y
> lo ajusto. Mientras no me confirmes, **no se carga.**

**¿Aprobás rellenar `materials`/`careInstructions` con el texto aprobado?**
[ ] Sí · [ ] No, esperar definición de técnica

---

## Campos que faltan y NO puedo completar por inferencia

Estos quedan **bloqueados** hasta que me pases el dato real (no los invento):

| Campo | Estado | Por qué importa |
|---|---|---|
| Técnica de estampa real por producto | Desconocida (nombre genérico dice "DTF Semitono y DTF Textil" mezclado) | Es un atributo de producto real; hoy no se puede afirmar cuál usa cada uno |
| `color` de variante | `null` en la DB (`ProductVariant.color`, no expuesto en el admin todavía) | Necesario para filtros "remera negra/blanca" y para feed de compras |
| Medidas del producto (ancho/largo) | No existe campo; la guía de talles (`SIZE_GUIDE_CM`) sí existe aparte | Ya cubierto por la guía de talles; no hace falta por producto |
| Composición exacta (gramaje, % algodón) | Solo el texto genérico aprobado | Si querés el dato real por producto, pasámelo |
| Reseñas/ratings | No se crean (regla del proyecto: no hay sistema de reseñas verificadas) | — |
