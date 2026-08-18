import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Settings } from "@/server/db/models";

// GET — Fetch current store settings
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne().lean();

    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({
        siteName: "Shajgoj.bd",
        siteDescription: "Premium beauty, jewelry & lifestyle accessories for Bangladesh",
        contactEmail: "hello@shajgoj.bd",
        contactPhone: "+880 1711-223344",
        address: "House 42, Road 11, Banani, Dhaka 1213",
        socialLinks: {
          instagram: "https://instagram.com/shajgojbd",
          facebook: "https://facebook.com/shajgojbd",
          whatsapp: "https://wa.me/8801711223344",
        },
        shipping: {
          freeShippingThreshold: 2000,
          defaultShippingCost: 120,
          insideDhakaCost: 70,
          outsideDhakaCost: 120,
        },
        paymentGateways: [
          { name: "Cash on Delivery", enabled: true, config: {} },
          { name: "bKash", enabled: true, config: {} },
          { name: "Nagad", enabled: true, config: {} },
          { name: "SSLCommerz", enabled: true, config: {} },
        ],
      });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch (err: any) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT / POST — Update store settings
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(data);
    } else {
      if (data.siteName) settings.siteName = data.siteName;
      if (data.siteDescription) settings.siteDescription = data.siteDescription;
      if (data.contactEmail) settings.contactEmail = data.contactEmail;
      if (data.contactPhone) settings.contactPhone = data.contactPhone;
      if (data.address) settings.address = data.address;
      if (data.socialLinks) settings.socialLinks = { ...settings.socialLinks, ...data.socialLinks };
      if (data.shipping) settings.shipping = { ...settings.shipping, ...data.shipping };
      if (data.paymentGateways) settings.paymentGateways = data.paymentGateways;
    }

    await settings.save();
    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch (err: any) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
