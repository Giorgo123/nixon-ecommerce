import Link from "next/link";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { SOCIAL_LINKS, getWhatsappUrl } from "@/lib/constants/social";

const COMPLAINT_BOOK_URL = "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario";

export default function Footer() {
  return (
    <footer className="mt-auto bg-nixon-bg-deep text-nixon-muted">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-black tracking-[0.22em] text-nixon-ink uppercase">
              Nixon Studio
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6">
              Streetwear, dark art y diseño oversize hecho en Villa María, Córdoba.
            </p>
            <div className="mt-6 max-w-xs">
              <NewsletterForm />
            </div>
          </div>

          <FooterColumn title="Hacete miembro">
            <FooterLink href="/products">Buscar tienda</FooterLink>
            <FooterLink href="/products">Ver catálogo</FooterLink>
          </FooterColumn>

          <FooterColumn title="Ayuda">
            <FooterExternalLink href={COMPLAINT_BOOK_URL}>Libro de quejas</FooterExternalLink>
            <FooterLink href="/cambios-y-devoluciones">Botón de arrepentimiento (Ley 24.240)</FooterLink>
            <FooterLink href="/cambios-y-devoluciones">Cambios y devoluciones</FooterLink>
            <FooterLink href="/contacto">Contacto</FooterLink>
          </FooterColumn>

          <FooterColumn title="Acerca de Nixon Studio">
            <FooterLink href="/contacto">Quiénes somos</FooterLink>
            <FooterLink href="/terminos-y-condiciones">Términos y condiciones</FooterLink>
            <FooterLink href="/privacidad">Privacidad</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-nixon-border pt-6">
          <p className="text-xs uppercase tracking-[0.15em]">Novedades: seguinos</p>
          <div className="flex items-center gap-4">
            <SocialIcon href={SOCIAL_LINKS.instagram.url} label="Instagram">
              <InstagramIcon />
            </SocialIcon>
            <SocialIcon href={getWhatsappUrl()} label="WhatsApp">
              <WhatsappIcon />
            </SocialIcon>
            {SOCIAL_LINKS.facebook && (
              <SocialIcon href={SOCIAL_LINKS.facebook} label="Facebook">
                <FacebookIcon />
              </SocialIcon>
            )}
            {SOCIAL_LINKS.twitter && (
              <SocialIcon href={SOCIAL_LINKS.twitter} label="X (Twitter)">
                <XIcon />
              </SocialIcon>
            )}
            {SOCIAL_LINKS.pinterest && (
              <SocialIcon href={SOCIAL_LINKS.pinterest} label="Pinterest">
                <PinterestIcon />
              </SocialIcon>
            )}
            {SOCIAL_LINKS.youtube && (
              <SocialIcon href={SOCIAL_LINKS.youtube} label="YouTube">
                <YoutubeIcon />
              </SocialIcon>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-nixon-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-[11px] tracking-wide sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Nixon Studio. Todos los derechos reservados.</p>
          <p>
            Defensa del consumidor: Ley 24.240 —{" "}
            <a
              href={COMPLAINT_BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-nixon-crimson-bright"
            >
              formulario oficial
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-nixon-ink-dim">{title}</p>
      <div className="mt-4 flex flex-col gap-2.5 text-sm">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-nixon-crimson-bright">
      {children}
    </Link>
  );
}

function FooterExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-colors hover:text-nixon-crimson-bright"
    >
      {children}
    </a>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}

// Iconos con los colores reales de marca (no monocromaticos) para que se
// reconozcan de un vistazo, igual que en cualquier footer de ecommerce grande.
function InstagramIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <defs>
        <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#ig-gradient)" />
      <rect x="9" y="9" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17" cy="17" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="22.3" cy="11.7" r="1.1" fill="#fff" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="#25D366" />
      <path
        fill="#fff"
        d="M22.72 19.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="#1877F2" />
      <path fill="#fff" d="M18.7 25v-8.4h2.8l.4-3.3h-3.2V11.2c0-.95.26-1.6 1.63-1.6h1.74V6.7A23.6 23.6 0 0 0 19.5 6.6c-2.53 0-4.27 1.55-4.27 4.4v2.3H12.4v3.3h2.83V25Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="#000" />
      <path
        fill="#fff"
        d="M20.53 9.5h2.4l-5.25 6 6.17 8.15h-4.83l-3.78-4.94-4.33 4.94H8.5l5.61-6.42L8.2 9.5h4.95l3.42 4.52Zm-.84 12.75h1.33L13.4 10.83h-1.43Z"
      />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="#E60023" />
      <path
        fill="#fff"
        d="M17 8.5c-4.7 0-8.5 3.4-8.5 8.1 0 3.5 2 5.4 3 5.4.4 0 .7-1.2.7-1.6 0-.4-.9-1.1-.9-2.9 0-3.2 2.4-5.8 5.9-5.8 3.2 0 5.5 1.9 5.5 4.9 0 3.2-1.6 5.9-3.9 5.9-1.3 0-2.3-1.1-2-2.5.4-1.6 1.2-3.3 1.2-4.5 0-2.5-3.5-2.1-3.5 1.3 0 .8.1 1.5.1 1.5s-1.1 4.7-1.3 5.6c-.4 1.6.1 4.2.1 4.4.1.1.2.1.3 0 .1-.2 1.5-2 2-3.6.1-.5.7-2.6.7-2.6.4.7 1.5 1.3 2.7 1.3 3.5 0 6.1-3.2 6.1-7.2 0-3.9-3.2-6.7-7.2-6.7Z"
      />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="1" y="6" width="32" height="22" rx="7" fill="#FF0000" />
      <path fill="#fff" d="M14 12.5v9l8-4.5Z" />
    </svg>
  );
}
