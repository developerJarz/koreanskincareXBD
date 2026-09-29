"use client";

// Newsletter sign-up form (behaviour unchanged from the previous homepage: not yet connected to a mailing list)
export function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Enter your email address"
        className="flex-1 px-5 py-3.5 rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
      <button
        type="submit"
        className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/20"
      >
        Join Club
      </button>
    </form>
  );
}
