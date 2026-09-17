import { getWhatsappUrl } from "@/lib/constants/social";

// Botón flotante fijo de WhatsApp. z-50: por encima del navbar (z-40) pero
// por debajo del overlay/panel del CartDrawer (z-[60]) para no taparlo.
export default function WhatsappButton() {
  return (
    <a
      href={getWhatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
    >
      <WhatsappIcon />
    </a>
  );
}

function WhatsappIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
      <path
        fill="#fff"
        d="M22.72 19.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"
      />
      <path
        fill="#fff"
        d="M17.05 5.5c-6.35 0-11.5 5.15-11.5 11.5 0 2.03.53 4.02 1.55 5.77L5.5 28.5l5.9-1.55a11.44 11.44 0 0 0 5.65 1.5h.01c6.34 0 11.5-5.15 11.5-11.5s-5.16-11.45-11.51-11.45Zm0 21.04h-.01a9.5 9.5 0 0 1-4.84-1.33l-.35-.21-3.5.92.94-3.42-.23-.35a9.53 9.53 0 0 1-1.47-5.15c0-5.27 4.29-9.55 9.56-9.55 2.55 0 4.95.99 6.76 2.8a9.5 9.5 0 0 1 2.79 6.76c0 5.27-4.29 9.53-9.65 9.53Z"
      />
    </svg>
  );
}
