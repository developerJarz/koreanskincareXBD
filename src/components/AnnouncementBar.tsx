export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground text-[11px]">
      <div className="overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-1.5 gap-10">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10 shrink-0">
              <span>✦ Free delivery inside Dhaka above ৳2,000</span>
              <span>✦ Cash on delivery all over Bangladesh</span>
              <span>✦ Easy 7-day exchange</span>
              <span>✦ New Autumn accessories are live</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
