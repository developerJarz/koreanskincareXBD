"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Megaphone,
  Palette,
  PanelBottom,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  HOME_SECTIONS,
  PRODUCT_ROW_SECTIONS,
  TRUST_ICONS,
  type StorefrontConfig,
  type TrustIcon,
} from "@/lib/storefront";
import { ImageUploader } from "../catalog/ImageUploader";
import {
  api,
  ApiError,
  Card,
  Field,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
  Switch,
  textareaClass,
} from "../catalog/ui";

type Section = "branding" | "homepage" | "announcement" | "footer" | "contact";

const SECTIONS: Array<{ id: Section; label: string; icon: typeof Palette; hint: string }> = [
  { id: "branding", label: "Logo & brand", icon: Palette, hint: "Logo, store name, favicon" },
  { id: "homepage", label: "Homepage", icon: Home, hint: "Banner, sections and their order" },
  { id: "announcement", label: "Top bar", icon: Megaphone, hint: "Scrolling messages" },
  { id: "footer", label: "Footer", icon: PanelBottom, hint: "Text and link columns" },
  { id: "contact", label: "Contact & social", icon: Phone, hint: "Phone, email, address" },
];

const TRUST_ICON_LABELS: Record<TrustIcon, string> = {
  shield: "Shield (authentic)",
  truck: "Truck (delivery)",
  refresh: "Arrows (returns)",
  sparkles: "Sparkles",
  heart: "Heart",
  gift: "Gift",
};

type Load = { config: StorefrontConfig; defaults: StorefrontConfig; canEdit: boolean };

// ─── Small field helpers ──────────────────────────────────────────────────────

function Text({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  maxLength = 120,
  multiline = false,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: React.ReactNode;
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const common = {
    id,
    value,
    maxLength,
    placeholder,
    disabled,
    "aria-invalid": Boolean(error) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      {multiline ? (
        <textarea rows={3} className={textareaClass} {...common} />
      ) : (
        <input className={inputClass} {...common} />
      )}
    </Field>
  );
}

function ImageField({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <ImageUploader
        value={value ? [{ url: value, alt: "" }] : []}
        onChange={(items) => onChange(items[0]?.url ?? "")}
        folder="site"
        max={1}
        label={label}
        withAlt={false}
        error={error}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Module ───────────────────────────────────────────────────────────────────

export function StorefrontModule() {
  const [data, setData] = useState<Load | null>(null);
  const [cfg, setCfg] = useState<StorefrontConfig | null>(null);
  const [saved, setSaved] = useState("");
  const [section, setSection] = useState<Section>("branding");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await api<Load>("/api/admin/storefront");
      setData(res);
      setCfg(res.config);
      setSaved(JSON.stringify(res.config));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load the website settings.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = cfg !== null && JSON.stringify(cfg) !== saved;

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = useCallback(
    <K extends keyof StorefrontConfig>(key: K, patch: Partial<StorefrontConfig[K]>) =>
      setCfg((c) => (c ? { ...c, [key]: { ...c[key], ...patch } } : c)),
    [],
  );

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setErrors({});
    try {
      const res = await api<{ config: StorefrontConfig }>("/api/admin/storefront", {
        method: "PUT",
        json: cfg,
      });
      setCfg(res.config);
      setSaved(JSON.stringify(res.config));
      toast.success("Website updated — changes are live now.");
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
        const first = Object.keys(err.fields)[0] ?? "";
        const area = first.split(".")[0];
        const jump: Record<string, Section> = {
          branding: "branding",
          hero: "homepage",
          promise: "homepage",
          footer: "footer",
          contact: "contact",
          social: "contact",
        };
        if (jump[area]) setSection(jump[area]);
      }
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const resetArea = (keys: Array<keyof StorefrontConfig>) => {
    if (!data || !cfg) return;
    if (
      !window.confirm(
        "Put this part back to the original design? (You can still undo by not saving.)",
      )
    )
      return;
    const next = { ...cfg };
    for (const k of keys) (next as any)[k] = structuredClone(data.defaults[k]);
    setCfg(next);
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="text-destructive">{loadError}</p>
        <button type="button" className={`${secondaryButton} mt-3`} onClick={load}>
          Try again
        </button>
      </div>
    );
  }
  if (!cfg || !data) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading website settings…
      </div>
    );
  }

  const readOnly = !data.canEdit;
  const err = (key: string) => errors[key];

  return (
    <div className="space-y-5">
      {/* Header + save bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-5 py-3 bg-background/95 backdrop-blur border-b sm:border sm:rounded-2xl border-border flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="font-serif text-2xl">Website design</h2>
          <p className="text-xs text-muted-foreground">
            {readOnly
              ? "You can view these settings. Only admins can change them."
              : dirty
                ? "You have unsaved changes."
                : "Everything is saved. Changes go live as soon as you save."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" target="_blank" rel="noreferrer" className={secondaryButton}>
            <ExternalLink className="w-4 h-4" aria-hidden="true" /> View website
          </a>
          {!readOnly && (
            <>
              <button
                type="button"
                className={secondaryButton}
                disabled={!dirty || saving}
                onClick={() => {
                  setCfg(JSON.parse(saved));
                  setErrors({});
                }}
              >
                Discard changes
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={!dirty || saving}
                onClick={save}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                Save & publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Section picker */}
        <nav
          aria-label="Website design sections"
          className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0"
        >
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            const hasError = Object.keys(errors).some((k) =>
              s.id === "homepage"
                ? k.startsWith("hero") || k.startsWith("promise")
                : s.id === "contact"
                  ? k.startsWith("contact") || k.startsWith("social")
                  : k.startsWith(s.id),
            );
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 lg:w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  {s.label}
                  {hasError && (
                    <span
                      className="ml-auto w-2 h-2 rounded-full bg-destructive"
                      aria-label="has errors"
                    />
                  )}
                </span>
                <span className="hidden lg:block text-[11px] text-muted-foreground mt-0.5">
                  {s.hint}
                </span>
              </button>
            );
          })}
        </nav>

        <fieldset disabled={readOnly} className="min-w-0 space-y-5">
          {section === "branding" && (
            <>
              <Card
                title="Logo"
                description="Upload a PNG or WebP with a transparent background. Leave empty to use the built-in KoreanSkincare.bd logo."
                action={
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => resetArea(["branding"])}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reset
                  </button>
                }
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <ImageField
                    label="Header logo"
                    value={cfg.branding.logoUrl}
                    onChange={(logoUrl) => set("branding", { logoUrl })}
                    error={err("branding.logoUrl")}
                  />
                  <ImageField
                    label="Footer logo (optional)"
                    value={cfg.branding.footerLogoUrl}
                    onChange={(footerLogoUrl) => set("branding", { footerLogoUrl })}
                    hint="A white/light version for the dark footer. Uses the header logo if empty."
                    error={err("branding.footerLogoUrl")}
                  />
                </div>
                <Field
                  label={`Logo height in header: ${cfg.branding.logoHeight}px`}
                  htmlFor="logo-height"
                >
                  <input
                    id="logo-height"
                    type="range"
                    min={24}
                    max={80}
                    step={2}
                    value={cfg.branding.logoHeight}
                    onChange={(e) => set("branding", { logoHeight: Number(e.target.value) })}
                    className="w-full accent-[var(--primary)]"
                  />
                </Field>
                {cfg.branding.logoUrl && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      Preview
                    </p>
                    <img
                      src={cfg.branding.logoUrl}
                      alt="Logo preview"
                      style={{ height: cfg.branding.logoHeight }}
                      className="w-auto object-contain"
                    />
                  </div>
                )}
              </Card>

              <Card title="Store name & browser icon">
                <div className="grid gap-4 md:grid-cols-2">
                  <Text
                    id="site-name"
                    label="Store name"
                    value={cfg.branding.siteName}
                    onChange={(siteName) => set("branding", { siteName })}
                    maxLength={80}
                    hint="Used in the browser tab, emails and the logo's screen-reader text."
                  />
                  <Text
                    id="tagline"
                    label="Tagline"
                    value={cfg.branding.tagline}
                    onChange={(tagline) => set("branding", { tagline })}
                    maxLength={80}
                    hint="Shown under the built-in logo."
                  />
                </div>
                <ImageField
                  label="Favicon (browser tab icon)"
                  value={cfg.branding.faviconUrl}
                  onChange={(faviconUrl) => set("branding", { faviconUrl })}
                  hint="A square PNG, at least 64×64. Leave empty to keep the current icon."
                  error={err("branding.faviconUrl")}
                />
              </Card>
            </>
          )}

          {section === "announcement" && (
            <Card
              title="Top announcement bar"
              description="The scrolling strip above the header on every page."
              action={
                <Switch
                  checked={cfg.announcement.enabled}
                  onChange={(enabled) => set("announcement", { enabled })}
                  label="Show the announcement bar"
                />
              }
            >
              <ul className="space-y-2">
                {cfg.announcement.messages.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <input
                      value={m}
                      maxLength={140}
                      onChange={(e) =>
                        set("announcement", {
                          messages: cfg.announcement.messages.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                      aria-label={`Message ${i + 1}`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      className={`${iconButton} h-10 w-10 text-destructive`}
                      aria-label={`Remove message ${i + 1}`}
                      onClick={() =>
                        set("announcement", {
                          messages: cfg.announcement.messages.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={secondaryButton}
                disabled={cfg.announcement.messages.length >= 8}
                onClick={() =>
                  set("announcement", { messages: [...cfg.announcement.messages, ""] })
                }
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add message
              </button>
              {cfg.announcement.enabled && cfg.announcement.messages.some(Boolean) && (
                <div className="rounded-lg bg-primary text-primary-foreground text-[11px] px-3 py-1.5 overflow-hidden whitespace-nowrap">
                  {cfg.announcement.messages
                    .filter(Boolean)
                    .map((m) => `✦ ${m}`)
                    .join("     ")}
                </div>
              )}
            </Card>
          )}

          {section === "homepage" && (
            <HomepageEditor cfg={cfg} setCfg={setCfg} set={set} err={err} resetArea={resetArea} />
          )}

          {section === "footer" && (
            <FooterEditor cfg={cfg} set={set} err={err} resetArea={resetArea} />
          )}

          {section === "contact" && (
            <>
              <Card
                title="Contact details"
                description="Shown on the Contact page and in the footer."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Text
                    id="c-phone"
                    label="Phone / hotline"
                    value={cfg.contact.phone}
                    onChange={(phone) => set("contact", { phone })}
                    maxLength={40}
                  />
                  <Text
                    id="c-whatsapp"
                    label="WhatsApp number"
                    value={cfg.contact.whatsapp}
                    onChange={(whatsapp) => set("contact", { whatsapp })}
                    maxLength={40}
                    hint="With country code, e.g. +8801711223344"
                  />
                  <Text
                    id="c-email"
                    label="Email"
                    value={cfg.contact.email}
                    onChange={(email) => set("contact", { email })}
                    error={err("contact.email")}
                  />
                  <Text
                    id="c-hours"
                    label="Opening hours"
                    value={cfg.contact.hours}
                    onChange={(hours) => set("contact", { hours })}
                  />
                </div>
                <Text
                  id="c-address"
                  label="Address"
                  value={cfg.contact.address}
                  onChange={(address) => set("contact", { address })}
                  maxLength={300}
                />
                <Text
                  id="c-map"
                  label="Google Maps link (optional)"
                  value={cfg.contact.mapUrl}
                  onChange={(mapUrl) => set("contact", { mapUrl })}
                  error={err("contact.mapUrl")}
                  maxLength={1000}
                  hint="Open your shop in Google Maps → Share → Copy link."
                />
              </Card>
              <Card title="Contact page text">
                <Text
                  id="c-heading"
                  label="Heading"
                  value={cfg.contact.heading}
                  onChange={(heading) => set("contact", { heading })}
                  maxLength={100}
                />
                <Text
                  id="c-intro"
                  label="Introduction"
                  value={cfg.contact.intro}
                  onChange={(intro) => set("contact", { intro })}
                  maxLength={400}
                  multiline
                />
              </Card>
              <Card title="Social media" description="Leave empty to hide an icon.">
                <div className="grid gap-4 md:grid-cols-2">
                  {(["facebook", "instagram", "youtube", "tiktok"] as const).map((k) => (
                    <Text
                      key={k}
                      id={`s-${k}`}
                      label={
                        k === "tiktok"
                          ? "TikTok"
                          : k === "youtube"
                            ? "YouTube"
                            : k[0].toUpperCase() + k.slice(1)
                      }
                      value={cfg.social[k]}
                      onChange={(v) => set("social", { [k]: v })}
                      error={err(`social.${k}`)}
                      placeholder={`https://${k}.com/yourpage`}
                      maxLength={300}
                    />
                  ))}
                </div>
              </Card>
            </>
          )}
        </fieldset>
      </div>
    </div>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

type SetFn = <K extends keyof StorefrontConfig>(
  key: K,
  patch: Partial<StorefrontConfig[K]>,
) => void;

function HomepageEditor({
  cfg,
  setCfg,
  set,
  err,
  resetArea,
}: {
  cfg: StorefrontConfig;
  setCfg: React.Dispatch<React.SetStateAction<StorefrontConfig | null>>;
  set: SetFn;
  err: (k: string) => string | undefined;
  resetArea: (keys: Array<keyof StorefrontConfig>) => void;
}) {
  const [open, setOpen] = useState<string>("hero");
  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= cfg.sections.length) return;
    const next = [...cfg.sections];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    setCfg({ ...cfg, sections: next });
  };
  const patchSection = (i: number, patch: Partial<StorefrontConfig["sections"][number]>) =>
    setCfg({ ...cfg, sections: cfg.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const enabledCount = useMemo(() => cfg.sections.filter((s) => s.enabled).length, [cfg.sections]);

  const panel = (id: string, title: string, children: React.ReactNode) => (
    <section className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(open === id ? "" : id)}
        aria-expanded={open === id}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left"
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-primary font-semibold">{open === id ? "Close" : "Edit"}</span>
      </button>
      {open === id && (
        <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border pt-4">{children}</div>
      )}
    </section>
  );

  return (
    <>
      <Card
        title="Sections & order"
        description={`${enabledCount} of ${cfg.sections.length} sections are showing. Use the arrows to change the order on the homepage. Product rows only appear when products are marked for them.`}
        action={
          <button type="button" className={secondaryButton} onClick={() => resetArea(["sections"])}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reset order
          </button>
        }
      >
        <ol className="divide-y divide-border rounded-xl border border-border">
          {cfg.sections.map((s, i) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-center gap-2 px-3 py-2 ${s.enabled ? "" : "opacity-60"}`}
            >
              <span className="w-6 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-40">
                {PRODUCT_ROW_SECTIONS.includes(s.id) ||
                s.id === "categories" ||
                s.id === "brands" ? (
                  <input
                    value={s.title}
                    maxLength={60}
                    onChange={(e) => patchSection(i, { title: e.target.value })}
                    aria-label={`Heading for ${HOME_SECTIONS[s.id]}`}
                    className={`${inputClass} h-8`}
                  />
                ) : (
                  <span className="text-sm font-medium">{HOME_SECTIONS[s.id]}</span>
                )}
                {(PRODUCT_ROW_SECTIONS.includes(s.id) ||
                  s.id === "categories" ||
                  s.id === "brands") && (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {HOME_SECTIONS[s.id]}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={iconButton}
                onClick={() => moveSection(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move ${HOME_SECTIONS[s.id]} up`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => moveSection(i, i + 1)}
                disabled={i === cfg.sections.length - 1}
                aria-label={`Move ${HOME_SECTIONS[s.id]} down`}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => patchSection(i, { enabled: !s.enabled })}
                aria-label={`${s.enabled ? "Hide" : "Show"} ${HOME_SECTIONS[s.id]}`}
                title={s.enabled ? "Showing — click to hide" : "Hidden — click to show"}
              >
                {s.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ol>
      </Card>

      {panel(
        "hero",
        "Hero banner (top of the homepage)",
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="h-badge"
              label="Badge"
              value={cfg.hero.badge}
              onChange={(badge) => set("hero", { badge })}
              maxLength={80}
            />
            <Text
              id="h-badgeNote"
              label="Badge note"
              value={cfg.hero.badgeNote}
              onChange={(badgeNote) => set("hero", { badgeNote })}
              maxLength={80}
            />
            <Text
              id="h-t1"
              label="Heading — line 1"
              value={cfg.hero.titleLine1}
              onChange={(titleLine1) => set("hero", { titleLine1 })}
              maxLength={80}
            />
            <Text
              id="h-t2"
              label="Heading — line 2 (highlighted)"
              value={cfg.hero.titleLine2}
              onChange={(titleLine2) => set("hero", { titleLine2 })}
              maxLength={80}
            />
          </div>
          <Text
            id="h-desc"
            label="Description"
            value={cfg.hero.description}
            onChange={(description) => set("hero", { description })}
            maxLength={400}
            multiline
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="h-pl"
              label="Main button text"
              value={cfg.hero.primaryLabel}
              onChange={(primaryLabel) => set("hero", { primaryLabel })}
              maxLength={40}
            />
            <Text
              id="h-ph"
              label="Main button link"
              value={cfg.hero.primaryHref}
              onChange={(primaryHref) => set("hero", { primaryHref })}
              error={err("hero.primaryHref")}
              hint="A page like /products or /category/serums"
            />
            <Text
              id="h-sl"
              label="Second button text"
              value={cfg.hero.secondaryLabel}
              onChange={(secondaryLabel) => set("hero", { secondaryLabel })}
              maxLength={40}
              hint="Leave empty to hide"
            />
            <Text
              id="h-sh"
              label="Second button link"
              value={cfg.hero.secondaryHref}
              onChange={(secondaryHref) => set("hero", { secondaryHref })}
              error={err("hero.secondaryHref")}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageField
              label="Banner image"
              value={cfg.hero.image}
              onChange={(image) => set("hero", { image })}
              hint="Portrait (4:5) photo works best, at least 1200px wide."
              error={err("hero.image")}
            />
            <div className="space-y-4">
              <Text
                id="h-alt"
                label="Image description (for Google & screen readers)"
                value={cfg.hero.imageAlt}
                onChange={(imageAlt) => set("hero", { imageAlt })}
                maxLength={150}
              />
              <Text
                id="h-fl"
                label="Card label on image"
                value={cfg.hero.featuredLabel}
                onChange={(featuredLabel) => set("hero", { featuredLabel })}
                maxLength={60}
              />
              <Text
                id="h-ft"
                label="Card title on image"
                value={cfg.hero.featuredTitle}
                onChange={(featuredTitle) => set("hero", { featuredTitle })}
                maxLength={80}
                hint="Leave empty to hide the card"
              />
              <Text
                id="h-fh"
                label="Card link"
                value={cfg.hero.featuredHref}
                onChange={(featuredHref) => set("hero", { featuredHref })}
                error={err("hero.featuredHref")}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="h-rating"
              label="Rating text"
              value={cfg.hero.ratingText}
              onChange={(ratingText) => set("hero", { ratingText })}
              maxLength={60}
              hint="Leave empty to hide"
            />
            <Text
              id="h-cust"
              label="Customers text"
              value={cfg.hero.customersText}
              onChange={(customersText) => set("hero", { customersText })}
              maxLength={60}
            />
          </div>
          <ResetLink onClick={() => resetArea(["hero"])} />
        </>,
      )}

      {panel(
        "trust",
        "Trust badges",
        <>
          <ul className="space-y-3">
            {cfg.trust.items.map((item, i) => (
              <li
                key={i}
                className="grid gap-2 sm:grid-cols-[10rem_1fr_1fr_auto] items-end rounded-xl border border-border p-3"
              >
                <Field label="Icon" htmlFor={`t-icon-${i}`}>
                  <select
                    id={`t-icon-${i}`}
                    value={item.icon}
                    onChange={(e) =>
                      set("trust", {
                        items: cfg.trust.items.map((x, j) =>
                          j === i ? { ...x, icon: e.target.value as TrustIcon } : x,
                        ),
                      })
                    }
                    className={inputClass}
                  >
                    {TRUST_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {TRUST_ICON_LABELS[ic]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Text
                  id={`t-title-${i}`}
                  label="Title"
                  value={item.title}
                  maxLength={60}
                  onChange={(title) =>
                    set("trust", {
                      items: cfg.trust.items.map((x, j) => (j === i ? { ...x, title } : x)),
                    })
                  }
                />
                <Text
                  id={`t-sum-${i}`}
                  label="Short text"
                  value={item.summary}
                  maxLength={100}
                  onChange={(summary) =>
                    set("trust", {
                      items: cfg.trust.items.map((x, j) => (j === i ? { ...x, summary } : x)),
                    })
                  }
                />
                <button
                  type="button"
                  className={`${iconButton} h-10 w-10 text-destructive`}
                  aria-label={`Remove badge ${i + 1}`}
                  onClick={() => set("trust", { items: cfg.trust.items.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={secondaryButton}
            disabled={cfg.trust.items.length >= 6}
            onClick={() =>
              set("trust", {
                items: [...cfg.trust.items, { icon: "sparkles", title: "", summary: "" }],
              })
            }
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add badge
          </button>
          <ResetLink onClick={() => resetArea(["trust"])} />
        </>,
      )}

      {panel(
        "promise",
        "Brand promise block",
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="p-eyebrow"
              label="Small heading"
              value={cfg.promise.eyebrow}
              onChange={(eyebrow) => set("promise", { eyebrow })}
              maxLength={80}
            />
            <div />
            <Text
              id="p-t1"
              label="Heading — line 1"
              value={cfg.promise.titleLine1}
              onChange={(titleLine1) => set("promise", { titleLine1 })}
              maxLength={80}
            />
            <Text
              id="p-t2"
              label="Heading — line 2"
              value={cfg.promise.titleLine2}
              onChange={(titleLine2) => set("promise", { titleLine2 })}
              maxLength={80}
            />
          </div>
          <Text
            id="p-desc"
            label="Text"
            value={cfg.promise.description}
            onChange={(description) => set("promise", { description })}
            maxLength={500}
            multiline
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="p-cl"
              label="Button text"
              value={cfg.promise.ctaLabel}
              onChange={(ctaLabel) => set("promise", { ctaLabel })}
              maxLength={40}
            />
            <Text
              id="p-ch"
              label="Button link"
              value={cfg.promise.ctaHref}
              onChange={(ctaHref) => set("promise", { ctaHref })}
              error={err("promise.ctaHref")}
            />
          </div>
          <ImageField
            label="Image"
            value={cfg.promise.image}
            onChange={(image) => set("promise", { image })}
            error={err("promise.image")}
            hint="Landscape (4:3) photo."
          />
          <ResetLink onClick={() => resetArea(["promise"])} />
        </>,
      )}

      {panel(
        "testimonials",
        "Customer reviews",
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="r-eyebrow"
              label="Small heading"
              value={cfg.testimonials.eyebrow}
              onChange={(eyebrow) => set("testimonials", { eyebrow })}
              maxLength={80}
            />
            <Text
              id="r-title"
              label="Heading"
              value={cfg.testimonials.title}
              onChange={(title) => set("testimonials", { title })}
              maxLength={100}
            />
          </div>
          <ul className="space-y-3">
            {cfg.testimonials.items.map((item, i) => (
              <li key={i} className="rounded-xl border border-border p-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
                  <Text
                    id={`r-name-${i}`}
                    label="Name"
                    value={item.name}
                    maxLength={60}
                    onChange={(name) =>
                      set("testimonials", {
                        items: cfg.testimonials.items.map((x, j) => (j === i ? { ...x, name } : x)),
                      })
                    }
                  />
                  <Text
                    id={`r-city-${i}`}
                    label="City"
                    value={item.city}
                    maxLength={40}
                    onChange={(city) =>
                      set("testimonials", {
                        items: cfg.testimonials.items.map((x, j) => (j === i ? { ...x, city } : x)),
                      })
                    }
                  />
                  <button
                    type="button"
                    className={`${iconButton} h-10 w-10 text-destructive`}
                    aria-label={`Remove review ${i + 1}`}
                    onClick={() =>
                      set("testimonials", {
                        items: cfg.testimonials.items.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Text
                  id={`r-quote-${i}`}
                  label="Review"
                  value={item.quote}
                  maxLength={400}
                  multiline
                  onChange={(quote) =>
                    set("testimonials", {
                      items: cfg.testimonials.items.map((x, j) => (j === i ? { ...x, quote } : x)),
                    })
                  }
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={secondaryButton}
            disabled={cfg.testimonials.items.length >= 9}
            onClick={() =>
              set("testimonials", {
                items: [...cfg.testimonials.items, { name: "", city: "", quote: "" }],
              })
            }
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add review
          </button>
          <ResetLink onClick={() => resetArea(["testimonials"])} />
        </>,
      )}

      {panel(
        "newsletter",
        "Newsletter sign-up",
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Text
              id="n-eyebrow"
              label="Small heading"
              value={cfg.newsletter.eyebrow}
              onChange={(eyebrow) => set("newsletter", { eyebrow })}
              maxLength={80}
            />
            <Text
              id="n-title"
              label="Heading"
              value={cfg.newsletter.title}
              onChange={(title) => set("newsletter", { title })}
              maxLength={100}
            />
          </div>
          <Text
            id="n-desc"
            label="Text"
            value={cfg.newsletter.description}
            onChange={(description) => set("newsletter", { description })}
            maxLength={300}
            multiline
          />
          <ResetLink onClick={() => resetArea(["newsletter"])} />
        </>,
      )}
    </>
  );
}

function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset this block to the original
    </button>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterEditor({
  cfg,
  set,
  err,
  resetArea,
}: {
  cfg: StorefrontConfig;
  set: SetFn;
  err: (k: string) => string | undefined;
  resetArea: (keys: Array<keyof StorefrontConfig>) => void;
}) {
  const cols = cfg.footer.columns;
  const setCols = (columns: StorefrontConfig["footer"]["columns"]) => set("footer", { columns });

  return (
    <>
      <Card
        title="Footer text"
        action={
          <button type="button" className={secondaryButton} onClick={() => resetArea(["footer"])}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Reset
          </button>
        }
      >
        <Text
          id="f-about"
          label="About text (under the logo)"
          value={cfg.footer.about}
          onChange={(about) => set("footer", { about })}
          maxLength={400}
          multiline
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Text
            id="f-copy"
            label="Copyright line"
            value={cfg.footer.copyright}
            onChange={(copyright) => set("footer", { copyright })}
            maxLength={150}
            hint="The year is added automatically."
          />
          <Text
            id="f-note"
            label="Bottom note"
            value={cfg.footer.bottomNote}
            onChange={(bottomNote) => set("footer", { bottomNote })}
            maxLength={150}
            hint="e.g. payment methods"
          />
        </div>
      </Card>

      <Card
        title="Link columns"
        description="Up to 4 columns with up to 10 links each. Links can be site pages (/about) or full web addresses."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {cols.map((col, ci) => (
            <div key={ci} className="rounded-xl border border-border p-3 space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Text
                    id={`col-${ci}`}
                    label={`Column ${ci + 1} heading`}
                    value={col.title}
                    maxLength={60}
                    onChange={(title) =>
                      setCols(cols.map((c, j) => (j === ci ? { ...c, title } : c)))
                    }
                  />
                </div>
                <button
                  type="button"
                  className={`${iconButton} h-10 w-10 text-destructive`}
                  aria-label={`Remove column ${ci + 1}`}
                  onClick={() => setCols(cols.filter((_, j) => j !== ci))}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-2">
                {col.links.map((l, li) => {
                  const e = err(`footer.columns.${ci}.links.${li}`);
                  const patchLink = (patch: Partial<typeof l>) =>
                    setCols(
                      cols.map((c, j) =>
                        j === ci
                          ? {
                              ...c,
                              links: c.links.map((x, k) => (k === li ? { ...x, ...patch } : x)),
                            }
                          : c,
                      ),
                    );
                  return (
                    <li key={li}>
                      <div className="flex gap-1.5">
                        <input
                          value={l.label}
                          maxLength={60}
                          placeholder="Link text"
                          aria-label={`Column ${ci + 1} link ${li + 1} text`}
                          onChange={(ev) => patchLink({ label: ev.target.value })}
                          className={`${inputClass} h-9`}
                        />
                        <input
                          value={l.href}
                          maxLength={500}
                          placeholder="/page"
                          aria-label={`Column ${ci + 1} link ${li + 1} address`}
                          aria-invalid={Boolean(e) || undefined}
                          onChange={(ev) => patchLink({ href: ev.target.value })}
                          className={`${inputClass} h-9`}
                        />
                        <button
                          type="button"
                          className={`${iconButton} h-9 w-9 shrink-0`}
                          aria-label={`Remove link ${li + 1}`}
                          onClick={() =>
                            setCols(
                              cols.map((c, j) =>
                                j === ci ? { ...c, links: c.links.filter((_, k) => k !== li) } : c,
                              ),
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {e && <p className="text-xs text-destructive mt-1">{e}</p>}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline disabled:text-muted-foreground"
                disabled={col.links.length >= 10}
                onClick={() =>
                  setCols(
                    cols.map((c, j) =>
                      j === ci ? { ...c, links: [...c.links, { label: "", href: "" }] } : c,
                    ),
                  )
                }
              >
                + Add link
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={secondaryButton}
          disabled={cols.length >= 4}
          onClick={() => setCols([...cols, { title: "New column", links: [] }])}
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Add column
        </button>
      </Card>
    </>
  );
}
