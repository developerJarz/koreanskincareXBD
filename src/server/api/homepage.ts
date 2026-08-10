import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { HomepageSection, Settings, Banner } from "@/server/db/models";

// ─── Get all active homepage sections (ordered) ───
export const getHomepageSections = createServerFn({ method: "GET" })
  .handler(async () => {
    await connectDB();
    const sections = await HomepageSection.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    return JSON.parse(JSON.stringify(sections));
  });

// ─── Get site settings ───
export const getSiteSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    await connectDB();
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = (await Settings.create({})).toJSON();
    }
    return JSON.parse(JSON.stringify(settings));
  });

// ─── Get active banners ───
export const getActiveBanners = createServerFn({ method: "GET" })
  .validator((position?: string) => position)
  .handler(async ({ data: position }) => {
    await connectDB();
    const now = new Date();
    const query: Record<string, unknown> = {
      isActive: true,
      $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }],
    };
    // Filter out expired banners
    query.$and = [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
    ];
    if (position) query.position = position;

    const banners = await Banner.find(query)
      .sort({ sortOrder: 1 })
      .lean();
    return JSON.parse(JSON.stringify(banners));
  });

// ─── Admin: Update homepage section ───
export const updateHomepageSection = createServerFn({ method: "POST" })
  .validator(
    (data: { id: string; updates: Record<string, unknown> }) => data
  )
  .handler(async ({ data }) => {
    await connectDB();
    const section = await HomepageSection.findByIdAndUpdate(
      data.id,
      data.updates,
      { new: true }
    ).lean();
    return JSON.parse(JSON.stringify(section));
  });

// ─── Admin: Reorder homepage sections ───
export const reorderHomepageSections = createServerFn({ method: "POST" })
  .validator(
    (data: { sectionIds: string[] }) => data
  )
  .handler(async ({ data }) => {
    await connectDB();
    const updates = data.sectionIds.map((id, index) =>
      HomepageSection.findByIdAndUpdate(id, { sortOrder: index })
    );
    await Promise.all(updates);
    return { success: true };
  });

// ─── Admin: Update site settings ───
export const updateSiteSettings = createServerFn({ method: "POST" })
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data }) => {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    return JSON.parse(JSON.stringify(settings.toJSON()));
  });
