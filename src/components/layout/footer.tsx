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
      className="flex h-9 w-9 items-center justify-center rounded-full border border-nixon-border transition-colors hover:border-nixon-crimson hover:text-nixon-crimson-bright"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6a3.8 3.8 0 0 0 1.8.1c.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.2-1.2s-.2-.2-.4-.3Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.2-1.5 1.6-1.5H16.5V4.3A21 21 0 0 0 14.2 4c-2.3 0-3.9 1.4-3.9 4v2.5H8v3h2.3V21Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.3 3h3.2l-7 8 8.2 10h-6.4l-5-6.5L4.9 21H1.7l7.5-8.6L1.4 3h6.6l4.5 6Zm-1.1 16.2h1.8L7 4.7H5.1Z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.6l1.4-6s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.9-.2 1.1.6 2 1.7 2 2 0 3.5-2.1 3.5-5.2 0-2.7-2-4.6-4.8-4.6-3.3 0-5.2 2.4-5.2 4.9 0 1 .4 2 .8 2.6.1.1.1.2.1.3l-.3 1.3c-.1.2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.6 2.6-6.9 7.5-6.9 4 0 7 2.8 7 6.6 0 3.9-2.5 7.1-5.9 7.1-1.2 0-2.3-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z" />
    </svg>
  );
}
