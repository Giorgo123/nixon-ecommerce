"use client";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Compartir por WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      bg: "bg-[#25D366]",
      icon: <WhatsappIcon />,
    },
    {
      label: "Compartir en Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: "bg-[#1877F2]",
      icon: <FacebookIcon />,
    },
    {
      label: "Compartir en Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      bg: "bg-[#E60023]",
      icon: <PinterestIcon />,
    },
    {
      label: "Compartir en X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bg: "bg-black",
      icon: <XIcon />,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
        Compartir
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 ${link.bg}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

function WhatsappIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6a3.8 3.8 0 0 0 1.8.1c.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.2-1.2s-.2-.2-.4-.3Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.2-1.5 1.6-1.5H16.5V4.3A21 21 0 0 0 14.2 4c-2.3 0-3.9 1.4-3.9 4v2.5H8v3h2.3V21Z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.6l1.4-6s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.9-.2 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-2-4.6-4.8-4.6-3.3 0-5.2 2.4-5.2 4.9 0 1 .4 2 .8 2.6.1.1.1.2.1.3l-.3 1.3c-.1.2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.6 2.6-6.9 7.5-6.9 4 0 7 2.8 7 6.6 0 3.9-2.5 7.1-5.9 7.1-1.2 0-2.3-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.3 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L4.9 21H1.7l7.5-8.6L1.4 3h6.6l4.5 6Zm-1.1 16.2h1.8L7 4.7H5.1Z" />
    </svg>
  );
}
