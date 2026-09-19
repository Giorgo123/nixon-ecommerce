interface ShareButtonsProps {
  url: string;
  title: string;
  image?: string;
}

// Links reales de compartir de cada red (endpoints estándar públicos, no
// requieren SDK/API key): WhatsApp (wa.me), Facebook (sharer.php), Pinterest
// (pin/create) y X (intent/tweet). Cada uno abre en una pestaña nueva con la
// URL real del producto — no hay nada inventado ni un selector nativo que
// dependa del navegador.
export default function ShareButtons({ url, title, image }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: WhatsAppIcon,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FacebookIcon,
    },
    {
      name: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${
        image ? `&media=${encodeURIComponent(image)}` : ""
      }`,
      icon: PinterestIcon,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
        Compartir
      </span>
      <div className="flex items-center gap-1">
        {links.map(({ name, href, icon: Icon }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors hover:text-red-500 dark:text-white/60"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"
      />
      <path
        fill="currentColor"
        d="M12.05 2.5c-6.35 0-11.5 5.15-11.5 11.5 0 2.03.53 4.02 1.55 5.77L.5 25.5l5.9-1.55a11.44 11.44 0 0 0 5.65 1.5h.01c6.34 0 11.5-5.15 11.5-11.5S18.4 2.55 12.05 2.5Zm0 21.04h-.01a9.5 9.5 0 0 1-4.84-1.33l-.35-.21-3.5.92.94-3.42-.23-.35a9.53 9.53 0 0 1-1.47-5.15c0-5.27 4.29-9.55 9.56-9.55 2.55 0 4.95.99 6.76 2.8a9.5 9.5 0 0 1 2.79 6.76c0 5.27-4.29 9.53-9.65 9.53Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 21v-7.8h2.6l.4-3h-3V8.2c0-.87.24-1.46 1.5-1.46h1.6V4.1c-.28-.04-1.22-.12-2.32-.12-2.3 0-3.88 1.4-3.88 3.98v2.22H10v3h2.4V21h3.1Z"
      />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2.01.03-2.88.19-.79 1.22-5.03 1.22-5.03s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.46 0 .89-.57 2.23-.86 3.47-.25 1.04.52 1.88 1.54 1.88 1.85 0 3.27-1.95 3.27-4.77 0-2.49-1.79-4.24-4.34-4.24-2.96 0-4.69 2.22-4.69 4.51 0 .89.34 1.85.77 2.37.08.1.1.19.07.29-.08.32-.25 1.02-.29 1.16-.04.19-.15.23-.34.14-1.27-.59-2.06-2.44-2.06-3.93 0-3.2 2.32-6.14 6.7-6.14 3.51 0 6.25 2.51 6.25 5.86 0 3.5-2.2 6.31-5.27 6.31-1.03 0-2-.53-2.33-1.17l-.63 2.42c-.23.87-.85 1.97-1.26 2.63.95.29 1.95.45 3 .45 5.52 0 10-4.48 10-10S17.52 2 12 2Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.24 3h3.06l-6.69 7.65L22.5 21h-6.16l-4.82-6.3L6 21H2.94l7.16-8.18L1.5 3h6.32l4.36 5.76L18.24 3Zm-1.08 16.17h1.7L7.2 4.74H5.38l11.78 14.43Z"
      />
    </svg>
  );
}
