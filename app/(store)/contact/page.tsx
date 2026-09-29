import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { getStorefront } from "@/server/storefront";
import { whatsappLink } from "@/lib/storefront";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await getStorefront();
  return {
    title: `Contact us — ${branding.siteName}`,
    description: `Phone, WhatsApp, email and address for ${branding.siteName}.`,
  };
}

/** Everything on this page is edited in the admin "Website design" → Contact & social. */
export default async function ContactPage() {
  const { contact } = await getStorefront();
  const wa = whatsappLink(contact.whatsapp);

  const methods = [
    contact.phone && {
      icon: Phone,
      label: "Call us",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`,
    },
    wa && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: contact.whatsapp,
      href: wa,
      external: true,
    },
    contact.email && {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
  ].filter(Boolean) as Array<{
    icon: typeof Phone;
    label: string;
    value: string;
    href: string;
    external?: boolean;
  }>;

  return (
    <section className="container-x py-16 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold">Contact</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-3">{contact.heading}</h1>
        {contact.intro && (
          <p className="mt-5 text-muted-foreground leading-relaxed">{contact.intro}</p>
        )}
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map(({ icon: Icon, label, value, href, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="group flex items-start gap-4 h-full rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition"
            >
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{label}</span>
                <span className="block font-semibold text-foreground break-words group-hover:text-primary">
                  {value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {(contact.address || contact.hours) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {contact.address && (
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Visit us</p>
                <p className="font-semibold text-foreground">{contact.address}</p>
                {contact.mapUrl && (
                  <a
                    href={contact.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            </div>
          )}
          {contact.hours && (
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Opening hours</p>
                <p className="font-semibold text-foreground">{contact.hours}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
