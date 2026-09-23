async function syncFull() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteName: "koreanskincare.bd",
        siteDescription: "Premium authentic Korean skincare & beauty essentials for Bangladesh",
        contactEmail: "hello@koreanskincare.bd",
        socialLinks: {
          instagram: "https://instagram.com/koreanskincarebd",
          facebook: "https://facebook.com/koreanskincarebd",
          whatsapp: "https://wa.me/8801711223344",
        },
        seo: {
          defaultTitle: "koreanskincare.bd — Authentic Korean Skincare in Bangladesh",
          defaultDescription:
            "Discover 100% authentic Korean skincare, serums, sunscreens, and beauty essentials at koreanskincare.bd.",
        },
      }),
    });
    const data = await res.json();
    console.log("Full settings update:", data);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

syncFull();
