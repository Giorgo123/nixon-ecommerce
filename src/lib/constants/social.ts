// Punto unico de verdad para links de redes sociales y contacto directo.
// Instagram y WhatsApp son reales (ya se usaban sueltos en footer.tsx y
// contacto/page.tsx). Facebook, X, Pinterest y YouTube son opcionales: si no
// se configura el env var correspondiente, el link simplemente no se
// renderiza en vez de apuntar a una URL inventada.

const WHATSAPP_NUMBER = "5493535627388";

export const SOCIAL_LINKS = {
  instagram: {
    url: "https://www.instagram.com/nixonstudio98/?hl=es-la",
    handle: "@nixonstudio98",
  },
  whatsapp: {
    number: WHATSAPP_NUMBER,
    display: "+54 9 3535 62-7388",
  },
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
  pinterest: process.env.NEXT_PUBLIC_PINTEREST_URL,
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL,
};

const DEFAULT_WHATSAPP_MESSAGE = "Hola! Te escribo desde nixonstudio.com.ar";

export function getWhatsappUrl(message: string = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
