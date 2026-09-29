import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";

import { SiteLogoLink } from "@/components/Logo";
import { whatsappLink, type StorefrontConfig } from "@/lib/storefront";

// lucide has no TikTok icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.04.77.12V9.77a5.68 5.68 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const className = "hover:opacity-100 hover:text-primary transition";
  // Other websites open in a new tab; our own pages use client-side navigation
  return /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/** Text, links, contact details and social icons come from the admin "Website design". */
export function Footer({ config }: { config: StorefrontConfig }) {
  const { footer, contact, social, branding } = config;
  const wa = whatsappLink(contact.whatsapp);
  const socials = [
    { url: social.facebook, label: "Facebook", Icon: Facebook },
    { url: social.instagram, label: "Instagram", Icon: Instagram },
    { url: social.youtube, label: "YouTube", Icon: Youtube },
    { url: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { url: wa, label: "WhatsApp", Icon: MessageCircle },
  ].filter((s) => s.url);
  const columns = footer.columns.filter((c) => c.title || c.links.length);

  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="container-x py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-8 md:gap-10">
        <div className="col-span-2">
          <SiteLogoLink variant="footer" branding={branding} />
          {footer.about && (
            <p className="mt-4 text-sm opacity-70 max-w-sm leading-relaxed">{footer.about}</p>
          )}
          <ul className="mt-5 space-y-2 text-sm opacity-80">
            {contact.phone && (
              <li>
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" /> {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 hover:text-primary break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" aria-hidden="true" /> {contact.email}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-background/20 flex items-center justify-center hover:bg-background/10 transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        {columns.map((col, i) => (
          <div key={i}>
            {col.title && <p className="text-sm font-semibold mb-4 text-primary">{col.title}</p>}
            <ul className="space-y-2.5 text-sm opacity-75">
              {col.links.map((l, j) => (
                <li key={j}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-75 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <p>
            {footer.bottomNote}
            {footer.bottomNote && " · "}
            Powered by{" "}
            <a
              href="https://jarzdigital.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 hover:text-primary transition font-medium"
            >
              JarzDigital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
