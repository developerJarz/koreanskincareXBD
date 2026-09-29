/** Scrolling top bar. Messages are edited in the admin "Website design" → Top bar. */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const items = messages.filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="bg-primary text-primary-foreground text-[11px]">
      <p className="sr-only">{items.join(". ")}</p>
      <div className="overflow-hidden" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-marquee py-1.5 gap-10">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10 shrink-0">
              {items.map((m, j) => (
                <span key={j}>✦ {m}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
