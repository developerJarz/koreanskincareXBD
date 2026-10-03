# Graph Report - noors-elegance-main  (2026-09-28)

## Corpus Check
- 387 files · ~426,615 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 65 file(s) not represented in the graph (top: .csv 53, (none) 3, .woff2 3)

## Summary
- 2976 nodes · 6273 edges · 167 communities (127 shown, 40 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 172 edges (avg confidence: 0.86)
- Token cost: 485,087 input · 0 output

## Community Hubs (Navigation)
- UI/UX Design System Generator
- UI/UX BM25 Search Core
- UI/UX Data Quality Tests
- Runtime Dependencies
- shadcn Accordion/Avatar/Tabs UI
- Server API & DB Seeding
- Skill Script Regression Tests
- Admin Dashboard Shell
- Static Pages & Site Data
- Design Token JSON (A)
- shadcn Input/Tooltip UI
- Admin Brand Manager
- Admin Brands & Catalog API
- Admin/Vendor Marketplace Access
- Package Manifest & Lint Config
- Logo & Icon Generation
- Design Token JSON (B)
- Auth & Password API
- Admin Modules & Blog
- shadcn Dialog/Carousel UI
- CIP Mockup Generation
- Design System Output Formatting
- Dark Palette & Contrast Logic
- Slide Search CLI
- Design Token JSON (C)
- Admin Products & Settings API
- shadcn Form Controls UI
- Semantic Color Tokens
- Customer Auth & Account Pages
- Storefront Shell & Cart
- Public Catalog API
- HTML Token Validator
- Tailwind Config Generator Tests
- Home & Brand Listing Pages
- CIP Search Core
- Server DB Models
- TypeScript Config
- Color Mode Resolution
- Session & Orders API
- Legacy Backend DB Models
- Brand Guidelines Docs
- Brand/Category/Product Pages
- Token Architecture Docs
- Size Token JSON
- Tailwind Config Generator
- Order Management & Checkout
- Root Layout & Product Page
- Dev Dependencies
- Slide Deck Generator
- Slides HTML Template
- shadcn Command Palette UI
- CIP Prompt Engineering
- Slide Background Fetcher
- shadcn components.json
- shadcn Alert/Toggle UI
- Brand Asset Organization
- Social Photos Design
- Token Embedding & Catalog Sync
- File Uploads
- Shajgoj.bd Logos & Legacy Branding
- Vendor Dashboard
- shadcn Menubar UI
- Brand-to-Token Sync
- shadcn Form (react-hook-form)
- Order Models (Duplicated)
- Banner Design Reference
- Design Routing Guide
- Design Token JSON (D)
- shadcn Installer Tests
- Search Eval Fixture Tests
- Email Delivery & Test Script
- Copywriting Formulas
- Font/Icon Catalog Refresh Tests
- Multi-Vendor Admin Module
- Listing Filters
- Brand Color Extraction
- Web Stack Freshness Tests
- Platform README & Robots
- Design Token Starter
- Domain Detection Tests
- Search Domain Tests
- DB Connection & Category Model
- Brand Context Injection
- Token Validator
- Canvas Design & License
- shadcn Installer
- shadcn Installer Methods
- Tailwind Config Output
- Text Layout Resilience Tests
- shadcn Chart (Recharts)
- Cart Models (Duplicated)
- Wishlist Models (Duplicated)
- Banner Sizes & Styles
- shadcn Accessibility Docs
- Native/Desktop Stack Tests
- User Models (Duplicated)
- Product Models (Duplicated)
- Token CSS/Tailwind Generator
- Motion Duration Tokens
- Tailwind Generator Init
- Password Rotation Script
- Notification Models (Duplicated)
- Logo BM25 Search
- Icon BM25 Search
- Slides BM25 Search
- Tailwind Utilities & ARIA
- shadcn Add Component Tests
- Generated Config JS Validity
- UI Stack Search Contract
- shadcn Navigation Menu UI
- shadcn Select UI
- shadcn Breadcrumb UI
- shadcn Drawer UI
- Catalog Seed Script
- Address Models (Duplicated)
- Coupon Models (Duplicated)
- Homepage Section Models
- Review Models (Duplicated)
- CIP Deliverables
- shadcn Theming & Dark Mode
- Error Capture
- npm Scripts
- Logo Color Psychology
- Design Dials & Persistence
- Tokenizer Tests
- BM25 Core Tests
- Lovable Error Reporting
- Analytics Model
- XL Size Token
- None Token
- Tailwind Responsive Design
- UI Styling Requirements
- Next.js Config & Headers
- Primary Hover Token
- Ring Token
- Temp Project Fixture
- Test: Add Without Config
- Test: Already Installed
- Test: Add Dry Run
- Test: Add All Dry Run
- Test: List No Config
- Test: List Installed
- Test: Default Project Root
- Test: Installed Empty
- Test: Add Fonts
- Test: Add Breakpoints
- Test: Plugin Dedup
- Test: Plugin Recommendations
- Test: Next.js Plugins
- Test: TS Config Output
- Test: Default TS Init
- Test: Valid Config
- Test: Empty Theme Config
- Test: Write Config
- Test: Invalid Write Path
- Test: Framework Init
- Test: Full JS Config
- Test: Default JS Path
- Test: Next.js Content Paths
- Test: Add Colors
- Next Env Types
- AGENTS.md (Empty)

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `connectDB()` - 125 edges
3. `react` - 86 edges
4. `serverError()` - 84 edges
5. `next` - 76 edges
6. `lucide-react` - 67 edges
7. `requireAuth()` - 63 edges
8. `TailwindConfigGenerator` - 58 edges
9. `mongoose` - 50 edges
10. `isObjectId()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Global Search (Ctrl+K), Notification Center & Seasonal Theme Switcher` --semantically_similar_to--> `Command Palette Component`  [INFERRED] [semantically similar]
  README.md → .agents/skills/ui-styling/references/shadcn-components.md
- `favicon.png - Shajgoj.bd stacked logo (S emblem over wordmark)` --semantically_similar_to--> `app/icon.png - Shajgoj.bd app icon (S emblem + wordmark)`  [INFERRED] [semantically similar]
  public/favicon.png → app/icon.png
- `cleanLimits()` --indirect_call--> `isObjectId()`  [INFERRED]
  app/api/admin/vendors/route.ts → src/server/security/validation.ts
- `Typography Tailwind Config` --semantically_similar_to--> `Tailwind Integration`  [INFERRED] [semantically similar]
  .agents/skills/brand/references/typography-specifications.md → .agents/skills/design-system/references/tailwind-integration.md
- `Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)` --conceptually_related_to--> `Enterprise Admin Operations Hub (/admin)`  [AMBIGUOUS]
  public/robots.txt → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brand Guidelines to Design Token Sync Pipeline** — agents_skills_brand_skill_brand_guidelines_md, agents_skills_brand_scripts_sync_brand_to_tokens, agents_skills_brand_skill_design_tokens_json, agents_skills_brand_skill_design_tokens_css, agents_skills_brand_scripts_inject_brand_context [EXTRACTED 1.00]
- **Three-Layer Design Token System** — agents_skills_design_system_references_primitive_tokens, agents_skills_design_system_references_semantic_tokens, agents_skills_design_system_references_component_tokens, agents_skills_design_system_references_token_architecture [EXTRACTED 1.00]
- **Banner Layout Design Principles** — agents_skills_banner_design_references_banner_sizes_and_styles_three_zone_rule, agents_skills_banner_design_references_banner_sizes_and_styles_safe_zones, agents_skills_banner_design_references_banner_sizes_and_styles_cta_rules, agents_skills_banner_design_references_banner_sizes_and_styles_text_to_image_ratio [INFERRED 0.85]
- **Complete Brand Package Pipeline (logo -> CIP -> pitch deck)** — agents_skills_design_skill_complete_brand_package_workflow, agents_skills_design_scripts_logo_generate, agents_skills_design_scripts_cip_generate, agents_skills_design_scripts_cip_render_html, agents_skills_design_references_slides_create_doc [EXTRACTED 1.00]
- **Brand -> Design System -> UI Styling Dependency Chain** — agents_skills_design_skill_brand_skill, agents_skills_design_skill_design_system_skill, agents_skills_design_skill_ui_styling_skill, agents_skills_design_references_design_routing_skill_dependency_chain [EXTRACTED 1.00]
- **Slides Knowledge Base (layouts, template, copywriting, strategies)** — agents_skills_design_references_slides_layout_patterns_doc, agents_skills_design_references_slides_html_template_doc, agents_skills_design_references_slides_copywriting_formulas_doc, agents_skills_design_references_slides_strategies_doc, agents_skills_design_references_slides_create_doc, agents_skills_design_references_slides_slides_workflow [EXTRACTED 1.00]
- **UI Styling Core Stack (shadcn/ui + Radix + Tailwind + Canvas)** — agents_skills_ui_styling_skill_shadcn_ui_component_layer, agents_skills_ui_styling_skill_radix_ui, agents_skills_ui_styling_skill_tailwind_css_styling_layer, agents_skills_ui_styling_skill_canvas_visual_design_layer [EXTRACTED 1.00]
- **Admin Operations Hub Enterprise Modules** — readme_admin_operations_hub, readme_sales_analytics_bi, readme_courier_integrations, readme_payment_gateways, readme_customer_crm_rfm, readme_multi_warehouse_inventory, readme_multi_vendor_marketplace, readme_returns_refunds, readme_coupon_campaign_engine, readme_ai_studio, readme_security_center, readme_financial_dashboard, readme_global_search [EXTRACTED 1.00]
- **Theming, Dark Mode & Contrast Guidance Across UI Skills** — agents_skills_ui_styling_references_shadcn_theming_dark_mode_next_themes, agents_skills_ui_styling_references_shadcn_theming_css_variable_system, agents_skills_ui_styling_references_tailwind_customization_dark_mode_configuration, agents_skills_ui_styling_references_shadcn_accessibility_color_contrast, agents_skills_ui_ux_pro_max_skill_light_dark_mode_contrast [INFERRED 0.85]
- **Shajgoj.bd Visual Identity System (emblems + wordmarks)** — app_icon_shajgoj_bd_brand, public_logo_shajgoj_bd_wordmark, public_shajgoj_bd_final_logo_01_s_split_circle_emblem, public_shajgoj_bd_final_pink_gold_ring_emblem, public_shajgoj_rose_vertical_bd_wordmark [INFERRED 0.85]
- **Legacy Korean Skincare .bd Identity (gold droplet favicon + logo + tagline)** — public_logo_svg, public_favicon_svg, public_logo_droplet_sparkle_emblem, public_logo_korean_skincare_brand, public_logo_authentic_seoul_beauty_tagline [INFERRED 0.85]
- **Shop-by-Category Image Set (bags, earrings, necklaces, rings, sunglasses, watches)** — src_assets_cat_bags, src_assets_cat_earrings, src_assets_cat_necklaces, src_assets_cat_rings, src_assets_cat_sunglasses, src_assets_cat_watches [INFERRED 0.85]
- **Noor's Elegance Product Category Taxonomy** — src_assets_cat_bags_bags_category, src_assets_cat_earrings_earrings_category, src_assets_cat_necklaces_necklaces_category, src_assets_cat_rings_rings_category, src_assets_cat_sunglasses_sunglasses_category, src_assets_cat_watches_watches_category [INFERRED 0.85]
- **Noor's Elegance Product Image Catalog (pr-* assets)** — src_assets_pr_bag1, src_assets_pr_bag2, src_assets_pr_ear1, src_assets_pr_neck1, src_assets_pr_ring1, src_assets_pr_scarf1, src_assets_pr_watch1 [INFERRED 0.85]
- **Gold/Rose-Gold Jewelry Image Set** — src_assets_pr_ear1, src_assets_pr_neck1, src_assets_pr_ring1, concept_jewelry_category [INFERRED 0.85]

## Communities (167 total, 40 thin omitted)

### Community 0 - "UI/UX Design System Generator"
Cohesion: 0.05
Nodes (29): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict. (+21 more)

### Community 1 - "UI/UX BM25 Search Core"
Cohesion: 0.06
Nodes (60): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+52 more)

### Community 2 - "UI/UX Data Quality Tests"
Cohesion: 0.07
Nodes (52): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+44 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.03
Nodes (64): dependencies, bcryptjs, better-auth, class-variance-authority, cloudinary, clsx, cmdk, date-fns (+56 more)

### Community 4 - "shadcn Accordion/Avatar/Tabs UI"
Cohesion: 0.06
Nodes (52): input-otp, @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-dropdown-menu, @radix-ui/react-tabs, AccordionContent, AccordionItem, AccordionTrigger (+44 more)

### Community 5 - "Server API & DB Seeding"
Cohesion: 0.07
Nodes (49): handleSeed(), POST(), SEED_USERS, warmUpDatabase(), register(), @tanstack/react-start, changePassword, getAllUsers (+41 more)

### Community 6 - "Skill Script Regression Tests"
Cohesion: 0.06
Nodes (41): Regression test for sync-brand-to-tokens.cjs. The color parser required a…, main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides., Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives. (+33 more)

### Community 7 - "Admin Dashboard Shell"
Cohesion: 0.06
Nodes (32): AdminDashboardClient(), AdminDashboardClientProps, AdminOrderStats, AdminProductStats, AdminSummary, AdminUserRow, AiStudioModule, ApiWebhooksHealthModule (+24 more)

### Community 8 - "Static Pages & Site Data"
Cohesion: 0.06
Nodes (52): AboutPage(), ContactPage(), RouteParams, SingleSegmentPage(), TrackOrderPage(), WishlistPage(), Handbags Product Category, Jewelry Product Category (Earrings, Necklaces, Rings) (+44 more)

### Community 9 - "Design Token JSON (A)"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 10 - "shadcn Input/Tooltip UI"
Cohesion: 0.06
Nodes (46): @radix-ui/react-separator, @radix-ui/react-tooltip, Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription (+38 more)

### Community 11 - "Admin Brand Manager"
Cohesion: 0.10
Nodes (44): Brand, BrandForm(), BrandManagerModule(), EMPTY, FormState, Category, CategoryForm(), CategoryManagerModule() (+36 more)

### Community 12 - "Admin Brands & Catalog API"
Cohesion: 0.14
Nodes (42): Ctx, DELETE(), PATCH(), PUT(), GET(), POST(), Ctx, DELETE() (+34 more)

### Community 13 - "Admin/Vendor Marketplace Access"
Cohesion: 0.08
Nodes (39): AdminPage(), allowedRoles, dynamic, LeanUserRecord, metadata, serializeUsers(), GET(), GET() (+31 more)

### Community 14 - "Package Manifest & Lint Config"
Cohesion: 0.05
Nodes (45): name, private, sideEffects, type, better-auth, cloudinary, date-fns, eslint (+37 more)

### Community 15 - "Logo & Icon Generation"
Cohesion: 0.07
Nodes (42): Logo Design Reference, Gemini Nano Banana Models, Logo Styles Catalog (55+ styles), Logo Workflow (brief -> generate -> HTML preview), apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch() (+34 more)

### Community 16 - "Design Token JSON (B)"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 17 - "Auth & Password API"
Cohesion: 0.17
Nodes (31): PATCH(), POST(), PATCH(), POST(), POST(), POST(), POST(), POST() (+23 more)

### Community 18 - "Admin Modules & Blog"
Cohesion: 0.09
Nodes (26): ReturnsRefundsModule, ReviewsAbandonedCartsModule, posts, POSTS, lucide-react, react, AdminHeader(), AdminHeaderProps (+18 more)

### Community 19 - "shadcn Dialog/Carousel UI"
Cohesion: 0.07
Nodes (37): embla-carousel-react, @radix-ui/react-alert-dialog, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+29 more)

### Community 20 - "CIP Mockup Generation"
Cohesion: 0.07
Nodes (38): CIP Workflow (brief -> mockups -> HTML presentation), CIP Design Reference, gemini-2.5-flash-image (flash, default), gemini-3-pro-image-preview (pro, 4K text), Generate Logo First If None Exists, build_cip_prompt(), check_logo_required(), generate_cip_set() (+30 more)

### Community 21 - "Design System Output Formatting"
Cohesion: 0.07
Nodes (35): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+27 more)

### Community 22 - "Dark Palette & Contrast Logic"
Cohesion: 0.09
Nodes (18): _contrast_ratio(), _derive_dark_palette(), _filter_anti_patterns_for_mode(), _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces. (+10 more)

### Community 23 - "Slide Search CLI"
Cohesion: 0.11
Nodes (33): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., calculate_pattern_break(), detect_domain() (+25 more)

### Community 24 - "Design Token JSON (C)"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 25 - "Admin Products & Settings API"
Cohesion: 0.17
Nodes (26): POST(), SORTS, PUT(), SHIPPING_KEYS, SOCIAL_KEYS, cleanLimits(), PATCH(), POST() (+18 more)

### Community 26 - "shadcn Form Controls UI"
Cohesion: 0.06
Nodes (23): clsx, @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-slider (+15 more)

### Community 27 - "Semantic Color Tokens"
Cohesion: 0.06
Nodes (31): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+23 more)

### Community 28 - "Customer Auth & Account Pages"
Cohesion: 0.14
Nodes (24): SecurityRbacModule, AccountPage(), CustomerTab, AuthHeading(), AuthPage(), CodeField(), ForgotPasswordPage(), LoginPage() (+16 more)

### Community 29 - "Storefront Shell & Cart"
Cohesion: 0.15
Nodes (20): NotFound(), CartPage(), StoreLayout(), OrderConfirmationPage(), zustand, AnnouncementBar(), CartSheet(), Footer() (+12 more)

### Community 30 - "Public Catalog API"
Cohesion: 0.11
Nodes (25): GET(), GET(), GET(), BrandInfo, CardProduct, CategoryNode, ProductFlag, SORT_OPTIONS (+17 more)

### Community 31 - "HTML Token Validator"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 32 - "Tailwind Config Generator Tests"
Cohesion: 0.07
Nodes (15): Test adding colors multiple times., Test adding full color palette., Test adding custom spacing., Test TailwindConfigGenerator class., Test generating JavaScript configuration., Test generating config with custom colors., Test generating config with plugins., Test validating config with no content paths. (+7 more)

### Community 33 - "Home & Brand Listing Pages"
Cohesion: 0.13
Nodes (22): BrandsPage(), metadata, CategoryCard(), HomePage(), LARGE_IMAGE_WIDTHS, ProductSection(), revalidate, SectionHeading() (+14 more)

### Community 34 - "CIP Search Core"
Cohesion: 0.10
Nodes (26): detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+18 more)

### Community 35 - "Server DB Models"
Cohesion: 0.08
Nodes (22): Banner, BannerDocument, bannerSchema, Blog, BlogDocument, blogSchema, BrandDocument, brandSchema (+14 more)

### Community 36 - "TypeScript Config"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+17 more)

### Community 37 - "Color Mode Resolution"
Cohesion: 0.10
Nodes (11): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution, Regression tests for the public style taxonomy and search contract. (+3 more)

### Community 38 - "Session & Orders API"
Cohesion: 0.13
Nodes (20): POST(), GET(), GET(), ORDER_STATUSES, PAYMENT_STATUSES, tokenMatches(), cleanAddress(), ORDER_STATUSES (+12 more)

### Community 39 - "Legacy Backend DB Models"
Cohesion: 0.12
Nodes (18): Analytics, AnalyticsDocument, analyticsSchema, Banner, BannerDocument, bannerSchema, Blog, BlogDocument (+10 more)

### Community 40 - "Brand Guidelines Docs"
Cohesion: 0.11
Nodes (24): Asset Approval Checklist, Asset Approval Review & Sign-off, Brand Guidelines Template, Color Palette Management, Color Brand Compliance Validation, Color System Hierarchy, Brand Consistency Checklist, Brand Channel Audit (+16 more)

### Community 41 - "Brand/Category/Product Pages"
Cohesion: 0.21
Nodes (21): BrandPage(), findBrand(), generateMetadata(), Params, SP, CategoryPage(), generateMetadata(), Params (+13 more)

### Community 42 - "Token Architecture Docs"
Cohesion: 0.13
Nodes (23): WCAG 2.1 Contrast Ratios, Design Components (Buttons, Spacing, Radius), Component Specifications, Component Tokens, Primitive Tokens, Semantic Tokens, Dark Mode Overrides, Semantic Interactive States (+15 more)

### Community 43 - "Size Token JSON"
Cohesion: 0.12
Nodes (23): $type, $value, lg, sm, $type, $value, $type, $value (+15 more)

### Community 44 - "Tailwind Config Generator"
Cohesion: 0.09
Nodes (13): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message) (+5 more)

### Community 45 - "Order Management & Checkout"
Cohesion: 0.10
Nodes (17): OrderManagementModule, SalesAnalyticsModule, CheckoutPage(), OrderManagementModuleProps, SalesAnalyticsModuleProps, ADMIN_PAGE_SIZE, BD_DISTRICTS, BD_DIVISIONS (+9 more)

### Community 46 - "Root Layout & Product Page"
Cohesion: 0.15
Nodes (17): metadata, sans, serif, viewport, generateMetadata(), loadProduct, Paragraphs(), Params (+9 more)

### Community 47 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 48 - "Slide Deck Generator"
Cohesion: 0.13
Nodes (21): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+13 more)

### Community 49 - "Slides HTML Template"
Cohesion: 0.15
Nodes (21): CIP HTML Presentation (base64 single-file, dark theme), Slides Create (design), Slides Reference (design), Slide Animation Classes (fade-up, scale, stagger, count), Chart.js 4.4.1 Integration, Slide CSS Token Variables (--color-primary, etc.), HTML Slide Template (design), embed-tokens.cjs output (+13 more)

### Community 50 - "shadcn Command Palette UI"
Cohesion: 0.13
Nodes (18): cmdk, @radix-ui/react-dialog, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem (+10 more)

### Community 51 - "CIP Prompt Engineering"
Cohesion: 0.12
Nodes (19): CIP Mockup Base Prompt Structure, CIP Mockup Prompt Engineering, CIP Negative Prompts, CIP Deliverable/Style/Lighting/Context Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, etc.), CIP Color Psychology Table, CIP Design Style Guide, Luxury Premium Style (black, gold, serif) (+11 more)

### Community 52 - "Slide Background Fetcher"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 53 - "shadcn components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 54 - "shadcn Alert/Toggle UI"
Cohesion: 0.14
Nodes (15): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge() (+7 more)

### Community 55 - "Brand Asset Organization"
Cohesion: 0.18
Nodes (17): Asset Organization Guide, Asset Naming Convention, Asset Metadata Schema (manifest.json), Asset Tagging System, checkManifest(), formatBytes(), formatOutput(), fs (+9 more)

### Community 56 - "Social Photos Design"
Cohesion: 0.18
Nodes (18): Social/Web/Print Banner Size Table, Pinterest Research Queries, assets-organizing skill, Social Photos Design Guide, Social HTML Design Rules (exact viewport, self-contained, no scroll), Social Platform Sizes (13 formats), project-management skill, Screenshot Export Options (Chrome headless, chrome-devtools, Playwright, Puppeteer) (+10 more)

### Community 57 - "Token Embedding & Catalog Sync"
Cohesion: 0.11
Nodes (13): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle (+5 more)

### Community 58 - "File Uploads"
Cohesion: 0.21
Nodes (14): folderFrom(), GET(), POST(), ref_path, ref_sharp, ALLOWED_TYPES, isCloudinaryConfigured(), isLocalUploadAllowed() (+6 more)

### Community 59 - "Shajgoj.bd Logos & Legacy Branding"
Cohesion: 0.20
Nodes (18): app/icon.png - Shajgoj.bd app icon (S emblem + wordmark), Shajgoj.bd Brand, favicon.png - Shajgoj.bd stacked logo (S emblem over wordmark), favicon.svg - gold droplet favicon (legacy Korean Skincare), Tagline: AUTHENTIC SEOUL BEAUTY, Droplet & Sparkle Emblem (gold #C59B6D), Korean Skincare .bd Brand (legacy identity), logo.png - SHAJGOJ.bd magenta wordmark (+10 more)

### Community 60 - "Vendor Dashboard"
Cohesion: 0.20
Nodes (17): date(), NAV, number(), ORDER_STATUS_LABEL, OrdersTab(), Overview(), ProductDialog(), ProductsTab() (+9 more)

### Community 61 - "shadcn Menubar UI"
Cohesion: 0.11
Nodes (12): @radix-ui/react-menubar, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator (+4 more)

### Community 62 - "Brand-to-Token Sync"
Cohesion: 0.19
Nodes (16): Brand Update Subcommand, Brand Color Presets, Always Sync All Three Brand Files, adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale() (+8 more)

### Community 63 - "shadcn Form (react-hook-form)"
Cohesion: 0.18
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 64 - "Order Models (Duplicated)"
Cohesion: 0.14
Nodes (15): addressSubSchema, optionalAddressSubSchema, Order, OrderDocument, orderItemSchema, orderSchema, addressSubSchema, optionalAddressSubSchema (+7 more)

### Community 65 - "Banner Design Reference"
Cohesion: 0.17
Nodes (16): Banner Sizes & Art Direction Styles Reference, 22 Art Direction Styles, Complete Banner Sizes (Social, Display, Website, Print), CTA Rules, Pinterest Research Queries, Print Specs (300 DPI, CMYK, bleed), Safe Zones, Text-to-Image Ratio (+8 more)

### Community 66 - "Design Routing Guide"
Cohesion: 0.23
Nodes (16): Design Routing Guide, Multi-Skill Workflows (setup, migration, component creation), Routing by Question Type, Skill Dependency Chain (brand -> design-system -> ui-styling -> app code), Three-Layer Token Architecture (primitive, semantic, component), Icon Design Reference, gemini-3.1-pro-preview, 12 Icon Categories (+8 more)

### Community 67 - "Design Token JSON (D)"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 68 - "shadcn Installer Tests"
Cohesion: 0.12
Nodes (9): Test adding components with overwrite flag., Test ShadcnInstaller class., Test listing installed components when none exist., Test initialization with custom project root., Test initialization with dry run mode., Test checking for existing shadcn config., Test checking for non-existent shadcn config., Test getting installed components when files exist. (+1 more)

### Community 69 - "Search Eval Fixture Tests"
Cohesion: 0.12
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 70 - "Email Delivery & Test Script"
Cohesion: 0.16
Nodes (12): ref_dns, nodemailer, env, freeMail, port, transport, codeEmail(), escapeHtml() (+4 more)

### Community 71 - "Copywriting Formulas"
Cohesion: 0.17
Nodes (15): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, Slides Copywriting Formulas, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (with emotions), PAS (Problem-Agitate-Solution), 15 Deck Strategies (+7 more)

### Community 73 - "Multi-Vendor Admin Module"
Cohesion: 0.24
Nodes (14): MultiVendorModule, api(), Category, CreateVendorDialog(), date(), discountOf(), MultiVendorModule(), ReviewProduct (+6 more)

### Community 74 - "Listing Filters"
Cohesion: 0.27
Nodes (11): Facet, FilterBody(), ListingFilters(), Props, RATINGS, Pagination(), Props, SortSelect() (+3 more)

### Community 75 - "Brand Color Extraction"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 77 - "Platform README & Robots"
Cohesion: 0.18
Nodes (13): Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *), Enterprise Admin Operations Hub (/admin), AI Studio (content generator, SEO meta optimizer, image enhancer), Coupon & Seasonal Campaign Engine (Eid, Ramadan, Pohela Boishakh), Bangladeshi Courier Integrations (Pathao, Steadfast, RedX, Paperfly, eCourier), Customer CRM & RFM Segmentation, Financial Dashboard, P&L & Report Export Center, Multi-Vendor Marketplace Module (+5 more)

### Community 78 - "Design Token Starter"
Cohesion: 0.15
Nodes (12): $type, $value, dark, semantic, primitive, $schema, $type, $value (+4 more)

### Community 81 - "DB Connection & Category Model"
Cohesion: 0.18
Nodes (9): connectDB(), MongooseCache, Category, CategoryDocument, categorySchema, seedDatabase, CategoryDocument, categorySchema (+1 more)

### Community 82 - "Brand Context Injection"
Cohesion: 0.27
Nodes (11): Extractable Brand Guideline Fields, extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs (+3 more)

### Community 83 - "Token Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 84 - "Canvas Design & License"
Cohesion: 0.20
Nodes (12): UI Styling Skill LICENSE (Apache 2.0), Apache License 2.0, Canvas Design System Reference, Design Movement Examples (Concrete Poetry, Chromatic Language, Geometric Silence...), Design Philosophy Approach (two-phase: philosophy then visual expression), Tailwind CSS Customization Reference, Layer Organization (@layer base/components/utilities, @apply), Tailwind Plugins (official and custom) (+4 more)

### Community 85 - "shadcn Installer"
Cohesion: 0.17
Nodes (8): main(), Path, Handle shadcn/ui component installation., Initialize installer. Args: project_root: Project root directory (default:…, ShadcnInstaller, Test adding all components without config., Test getting installed components without config., Test adding components with empty list.

### Community 86 - "shadcn Installer Methods"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 87 - "Tailwind Config Output"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 88 - "Text Layout Resilience Tests"
Cohesion: 0.18
Nodes (5): Canonical regression contracts for resilient UI text layouts., read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval, ambiguous_python_import_42132739bc44

### Community 89 - "shadcn Chart (Recharts)"
Cohesion: 0.24
Nodes (11): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent (+3 more)

### Community 90 - "Cart Models (Duplicated)"
Cohesion: 0.18
Nodes (10): Cart, CartDocument, cartItemSchema, cartSchema, Cart, CartDocument, cartItemSchema, cartSchema (+2 more)

### Community 91 - "Wishlist Models (Duplicated)"
Cohesion: 0.18
Nodes (10): Wishlist, WishlistDocument, wishlistItemSchema, wishlistSchema, Wishlist, WishlistDocument, wishlistItemSchema, wishlistSchema (+2 more)

### Community 92 - "Banner Sizes & Styles"
Cohesion: 0.24
Nodes (11): 22 Art Direction Styles, Banner CTA Rules (one CTA, bottom-right, 44px min), Banner Sizes & Art Direction Styles, Google Display Network Ad Sizes, Print Specs (300 DPI, CMYK, 3-5mm bleed), Safe Zones (central 70-80% of canvas), Text-to-Image Ratio (ads under 20% text), 3-Zone Visual Hierarchy Rule (logo top, message middle, CTA bottom) (+3 more)

### Community 93 - "shadcn Accessibility Docs"
Cohesion: 0.22
Nodes (11): shadcn/ui Accessibility Patterns Reference, Form Accessibility (labels, error handling, required fields), Keyboard Navigation & Focus Management, shadcn/ui Component Reference, Command Palette Component, Dialog / Overlay Components, Form Component (React Hook Form + Zod), Table / Data Table Component (+3 more)

### Community 95 - "User Models (Duplicated)"
Cohesion: 0.20
Nodes (8): mongoose, User, UserDocument, userSchema, userSchema, vendorSchema, IUser, IVendor

### Community 96 - "Product Models (Duplicated)"
Cohesion: 0.20
Nodes (9): Product, ProductDocument, productSchema, productVariantSchema, ProductDocument, productSchema, productVariantSchema, IProduct (+1 more)

### Community 97 - "Token CSS/Tailwind Generator"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 98 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 99 - "Tailwind Generator Init"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 100 - "Password Rotation Script"
Cohesion: 0.27
Nodes (9): ACCOUNTS, DRY_RUN, env(), envVars, generatePassword(), LEGACY_DEMO_EMAILS, main(), mongoUri (+1 more)

### Community 101 - "Notification Models (Duplicated)"
Cohesion: 0.22
Nodes (8): Notification, NotificationDocument, notificationSchema, Notification, NotificationDocument, notificationSchema, INotification, NotificationType

### Community 102 - "Logo BM25 Search"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 103 - "Icon BM25 Search"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 104 - "Slides BM25 Search"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 105 - "Tailwind Utilities & ARIA"
Cohesion: 0.22
Nodes (9): Screen Reader Support (ARIA labels, live regions, sr-only), Tailwind CSS Utility Reference, Arbitrary Values, Layout Utilities (Flexbox, Grid, Positioning), Tailwind Spacing Scale, ui-ux-pro-max Skill (SKILL.md), Phosphor Icons Default (Heroicons fallback, no emoji icons), Pre-Delivery Checklist (visual, interaction, light/dark, layout, accessibility) (+1 more)

### Community 106 - "shadcn Add Component Tests"
Cohesion: 0.22
Nodes (5): Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 107 - "Generated Config JS Validity"
Cohesion: 0.25
Nodes (7): Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 108 - "UI Stack Search Contract"
Cohesion: 0.22
Nodes (9): shadcn/ui Component Layer, Tailwind CSS Styling Layer, Available Stacks (nextjs, shadcn, html-tailwind, react, ...), Query Contract (one dominant intent, 2-5 terms, retry once), Search Domains (product, style, color, typography, ux, gsap, react, icons...), search.py (design intelligence search CLI), README: koreanskincare.bd Enterprise E-Commerce Platform, koreanskincare.bd Storefront & Management System (+1 more)

### Community 109 - "shadcn Navigation Menu UI"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 110 - "shadcn Select UI"
Cohesion: 0.28
Nodes (8): @radix-ui/react-select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 111 - "shadcn Breadcrumb UI"
Cohesion: 0.22
Nodes (8): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 112 - "shadcn Drawer UI"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 113 - "Catalog Seed Script"
Cohesion: 0.28
Nodes (7): BRANDS, CATEGORIES, DRY_RUN, HOMEPAGE_BRANDS, loadEnv(), main(), slug()

### Community 114 - "Address Models (Duplicated)"
Cohesion: 0.22
Nodes (7): Address, AddressDocument, addressSchema, Address, AddressDocument, addressSchema, IAddress

### Community 115 - "Coupon Models (Duplicated)"
Cohesion: 0.25
Nodes (7): Coupon, CouponDocument, couponSchema, CouponDocument, couponSchema, CouponType, ICoupon

### Community 116 - "Homepage Section Models"
Cohesion: 0.25
Nodes (7): HomepageSection, HomepageSectionDocument, homepageSectionSchema, HomepageSectionDocument, homepageSectionSchema, HomepageSectionType, IHomepageSection

### Community 117 - "Review Models (Duplicated)"
Cohesion: 0.22
Nodes (7): Review, ReviewDocument, reviewSchema, Review, ReviewDocument, reviewSchema, IReview

### Community 118 - "CIP Deliverables"
Cohesion: 0.29
Nodes (8): Apparel (polo, uniforms), Core Identity (primary logo, variations), Digital Assets (social media, email signature), CIP Deliverable Guide, Office Environment (reception signage, wayfinding, wall graphics), Stationery Set (business card, letterhead, envelope), Vehicle Branding (car, fleet), CIP Deliverable Categories (50+ items)

### Community 119 - "shadcn Theming & Dark Mode"
Cohesion: 0.25
Nodes (8): Color Contrast Requirements, shadcn/ui Theming & Customization Reference, Component Variant Customization, CSS Variable Theme System, Dark Mode Setup with next-themes, Tailwind Dark Mode Configuration, @theme Directive (custom design tokens), Light/Dark Mode Contrast Rules (4.5:1 text, token-driven theming)

### Community 120 - "Error Capture"
Cohesion: 0.32
Nodes (4): describeError(), describeStatus(), originalConsoleError, safeStringify()

### Community 121 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, format, lint, seed, start

### Community 122 - "Logo Color Psychology"
Cohesion: 0.33
Nodes (6): Color Accessibility (WCAG AA 4.5:1), Color Combinations by Industry, Color Harmony Types (mono, complementary, analogous, triadic), Logo Color Psychology, Quick Reference Palettes, Social Typography Hierarchy (48px headline at 1080px)

### Community 123 - "Design Dials & Persistence"
Cohesion: 0.33
Nodes (6): Multi-Page Design Systems, Design Dials (--variance, --motion, --density), Design System Generation (--design-system), GSAP Animation Presets, Master + Overrides Persistence Pattern (MASTER.md + pages/), ui-reasoning.csv (reasoning rules)

### Community 126 - "Lovable Error Reporting"
Cohesion: 0.40
Nodes (3): LovableErrorOptions, LovableEvents, Window

### Community 127 - "Analytics Model"
Cohesion: 0.40
Nodes (4): Analytics, AnalyticsDocument, analyticsSchema, IAnalyticsEvent

### Community 128 - "XL Size Token"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 129 - "None Token"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 130 - "Tailwind Responsive Design"
Cohesion: 0.67
Nodes (4): Tailwind CSS Responsive Design Reference, Breakpoint System (sm, md, lg, xl, 2xl), Container Queries, Mobile-First Approach

### Community 131 - "UI Styling Requirements"
Cohesion: 0.67
Nodes (4): UI Styling scripts requirements.txt, pytest (with pytest-cov, pytest-mock), UI Styling tests requirements.txt, shadcn_add.py (component installer script)

### Community 133 - "Primary Hover Token"
Cohesion: 0.67
Nodes (3): primary-hover, $type, $value

### Community 134 - "Ring Token"
Cohesion: 0.67
Nodes (3): ring, $type, $value

## Ambiguous Edges - Review These
- `Apache License 2.0` → `UI Styling Skill (SKILL.md)`  [AMBIGUOUS]
  .agents/skills/ui-styling/SKILL.md · relation: conceptually_related_to
- `UI Styling scripts requirements.txt` → `UI Styling tests requirements.txt`  [AMBIGUOUS]
  .agents/skills/ui-styling/scripts/tests/requirements.txt · relation: conceptually_related_to
- `Enterprise Admin Operations Hub (/admin)` → `Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)`  [AMBIGUOUS]
  public/robots.txt · relation: conceptually_related_to
- `Pink/Gold Offset Ring Emblem (pink upper arc, gold lower arc forming an S-like ring)` → `Droplet & Sparkle Emblem (gold #C59B6D)`  [AMBIGUOUS]
  public/shajgoj.bd final.png · relation: conceptually_related_to

## Knowledge Gaps
- **601 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+596 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1067 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Apache License 2.0` and `UI Styling Skill (SKILL.md)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `UI Styling scripts requirements.txt` and `UI Styling tests requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Enterprise Admin Operations Hub (/admin)` and `Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pink/Gold Offset Ring Emblem (pink upper arc, gold lower arc forming an S-like ring)` and `Droplet & Sparkle Emblem (gold #C59B6D)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `next` connect `Auth & Password API` to `Server API & DB Seeding`, `Admin Dashboard Shell`, `Static Pages & Site Data`, `Admin Brands & Catalog API`, `Admin/Vendor Marketplace Access`, `Package Manifest & Lint Config`, `Admin Modules & Blog`, `Admin Products & Settings API`, `Customer Auth & Account Pages`, `Storefront Shell & Cart`, `Public Catalog API`, `Home & Brand Listing Pages`, `Session & Orders API`, `Brand/Category/Product Pages`, `Order Management & Checkout`, `Root Layout & Product Page`, `File Uploads`, `Vendor Dashboard`, `Listing Filters`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `react` connect `Admin Modules & Blog` to `shadcn Accordion/Avatar/Tabs UI`, `Admin Dashboard Shell`, `Static Pages & Site Data`, `shadcn Input/Tooltip UI`, `Admin Brand Manager`, `Package Manifest & Lint Config`, `shadcn Dialog/Carousel UI`, `shadcn Form Controls UI`, `Customer Auth & Account Pages`, `Storefront Shell & Cart`, `Home & Brand Listing Pages`, `Order Management & Checkout`, `Root Layout & Product Page`, `shadcn Command Palette UI`, `shadcn Alert/Toggle UI`, `Vendor Dashboard`, `shadcn Menubar UI`, `shadcn Form (react-hook-form)`, `Multi-Vendor Admin Module`, `Listing Filters`, `shadcn Chart (Recharts)`, `shadcn Navigation Menu UI`, `shadcn Select UI`, `shadcn Breadcrumb UI`, `shadcn Drawer UI`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Manifest & Lint Config`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._