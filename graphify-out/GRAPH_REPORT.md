# Graph Report - noors-elegance-main  (2026-10-04)

## Corpus Check
- 376 files · ~451,570 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 66 file(s) not represented in the graph (top: .csv 53, (none) 4, .woff2 3)

## Summary
- 3117 nodes · 6773 edges · 172 communities (131 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 172 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `704594e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DesignSystemGenerator
- scripts/core.py
- validate_data.py
- dependencies
- cn
- connectDB
- generate-slide.py
- lucide-react
- site-data.ts
- gray
- sidebar.tsx
- ProductEditor.tsx
- serverError
- vendors/route.ts
- package.json
- icon/generate.py
- button
- next
- seed/route.ts
- carousel.tsx
- cip/generate.py
- design_system.py
- test_design_system_mode.py
- slide_search_core.py
- spacing
- server/db/models/index.ts
- react
- color
- optimizedImageUrl
- (store)/layout.tsx
- ShadcnInstaller
- html-token-validator.py
- TestTailwindConfigGenerator
- detect_domain
- logo/core.py
- types/index.ts
- compilerOptions
- test_style_taxonomy.py
- session.ts
- backend/db/models/index.ts
- Brand Skill
- product/[slug]/page.tsx
- Design System Skill
- radius
- TailwindConfigGenerator
- constants.ts
- BM25
- devDependencies
- Design Skill (SKILL.md)
- Slides Reference (design)
- command.tsx
- TestNativeDesktopStackFreshness
- fetch-background.py
- components.json
- class-variance-authority
- validate-asset.cjs
- Social Photos Design Guide
- embed-tokens.cjs
- uploads/route.ts
- Droplet & Sparkle Emblem (gold #C59B6D)
- VendorDashboardClient.tsx
- account/page.tsx
- BM25
- form.tsx
- backend/db/models/order.model.ts
- Banner Sizes & Art Direction Styles Reference
- Logo AI Prompt Engineering
- fontSize
- TestShadcnInstaller
- test_relevance_evaluator.py
- _normalize
- Slides Copywriting Formulas
- CatalogRefreshTest
- MultiVendorModule.tsx
- hero.jpg (Homepage hero flat-lay: rose-gold watch, flower pendant necklace, pearl earrings, stacked rings, cuff bangle, pink chain bag, perfume, lipstick)
- extract-colors.cjs
- TestWebStackFreshness
- Enterprise Admin Operations Hub (/admin)
- primitive
- TestDomainDetection
- breadcrumb.tsx
- mongoose
- inject-brand-context.cjs
- validate-tokens.cjs
- UI Styling Skill (SKILL.md)
- validation.ts
- .check_shadcn_config
- .generate_config_string
- pathlib
- chart.tsx
- backend/db/models/cart.model.ts
- backend/db/models/wishlist.model.ts
- Banner Sizes & Art Direction Styles
- shadcn/ui Accessibility Patterns Reference
- backend/db/models/payment.model.ts
- UserRole
- backend/db/models/product.model.ts
- generate-tokens.cjs
- duration
- ._base_config
- update-passwords.mjs
- backend/db/models/notification.model.ts
- Logo Design Reference
- ref_fs
- (store)/page.tsx
- ui-ux-pro-max Skill (SKILL.md)
- .test_add_all_components_success
- test_tailwind_config_gen.py
- search.py (design intelligence search CLI)
- navigation-menu.tsx
- _row_identities
- _search_csv_detailed
- drawer.tsx
- seed-catalog.mjs
- StorefrontModule.tsx
- backend/db/models/coupon.model.ts
- TestBm25CoreBehavior
- backend/db/models/review.model.ts
- server/db/models/analytics.model.ts
- shadcn/ui Theming & Customization Reference
- error-capture.ts
- scripts
- Logo Color Psychology
- Design System Generation (--design-system)
- TestTokenizer
- Soft Neutral/Blush Product Photography Style (warm light, cream and pink backdrops, rose-gold accents)
- lovable-error-reporting.ts
- skuPrefix
- xl
- none
- Tailwind CSS Responsive Design Reference
- UI Styling scripts requirements.txt
- next.config.mjs
- primary-hover
- ring
- .test_add_color_palette
- .test_add_spacing
- .test_generate_config_with_colors
- .test_generate_config_with_plugins
- .test_write_config_creates_content
- .test_full_configuration_typescript
- .test_default_output_path_typescript
- .test_base_config_structure
- .test_default_content_paths_react
- .temp_project
- blog/[slug]/page.tsx
- .test_add_plugins_no_duplicates
- .test_add_components_already_installed
- .test_recommend_plugins_nextjs
- .test_add_components_dry_run
- .test_init_default_typescript
- .test_list_installed_empty
- .test_list_installed_with_components
- .test_write_config
- .test_init_default_project_root
- .test_init_framework
- .test_init_dry_run
- .test_default_output_path_javascript
- .test_default_content_paths_nextjs
- .test_check_shadcn_config_exists
- next-env.d.ts
- AGENTS.md (empty)
- migrate-images-to-cloudinary.mjs
- backend/db/models/blog.model.ts
- .test_get_installed_components_empty
- .test_get_installed_components_with_files
- server/db/models/banner.model.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `connectDB()` - 144 edges
3. `serverError()` - 99 edges
4. `react` - 90 edges
5. `next` - 85 edges
6. `requireAuth()` - 77 edges
7. `lucide-react` - 71 edges
8. `TailwindConfigGenerator` - 58 edges
9. `isObjectId()` - 56 edges
10. `mongoose` - 51 edges

## Surprising Connections (you probably didn't know these)
- `Global Search (Ctrl+K), Notification Center & Seasonal Theme Switcher` --semantically_similar_to--> `Command Palette Component`  [INFERRED] [semantically similar]
  README.md → .agents/skills/ui-styling/references/shadcn-components.md
- `PATCH()` --indirect_call--> `isObjectId()`  [INFERRED]
  app/api/admin/categories/reorder/route.ts → src/server/security/validation.ts
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
- **Admin Operations Hub Enterprise Modules** — readme_admin_operations_hub, readme_sales_analytics_bi, readme_courier_integrations, readme_payment_gateways, readme_customer_crm_rfm, readme_multi_warehouse_inventory, readme_multi_vendor_marketplace, readme_returns_refunds, readme_coupon_campaign_engine, readme_ai_studio, readme_security_center, readme_financial_dashboard, readme_global_search [EXTRACTED 1.00]
- **Brand -> Design System -> UI Styling Dependency Chain** — agents_skills_design_skill_brand_skill, agents_skills_design_skill_design_system_skill, agents_skills_design_skill_ui_styling_skill, agents_skills_design_references_design_routing_skill_dependency_chain [EXTRACTED 1.00]
- **Complete Brand Package Pipeline (logo -> CIP -> pitch deck)** — agents_skills_design_skill_complete_brand_package_workflow, agents_skills_design_scripts_logo_generate, agents_skills_design_scripts_cip_generate, agents_skills_design_scripts_cip_render_html, agents_skills_design_references_slides_create_doc [EXTRACTED 1.00]
- **Slides Knowledge Base (layouts, template, copywriting, strategies)** — agents_skills_design_references_slides_layout_patterns_doc, agents_skills_design_references_slides_html_template_doc, agents_skills_design_references_slides_copywriting_formulas_doc, agents_skills_design_references_slides_strategies_doc, agents_skills_design_references_slides_create_doc, agents_skills_design_references_slides_slides_workflow [EXTRACTED 1.00]
- **UI Styling Core Stack (shadcn/ui + Radix + Tailwind + Canvas)** — agents_skills_ui_styling_skill_shadcn_ui_component_layer, agents_skills_ui_styling_skill_radix_ui, agents_skills_ui_styling_skill_tailwind_css_styling_layer, agents_skills_ui_styling_skill_canvas_visual_design_layer [EXTRACTED 1.00]
- **Banner Layout Design Principles** — agents_skills_banner_design_references_banner_sizes_and_styles_three_zone_rule, agents_skills_banner_design_references_banner_sizes_and_styles_safe_zones, agents_skills_banner_design_references_banner_sizes_and_styles_cta_rules, agents_skills_banner_design_references_banner_sizes_and_styles_text_to_image_ratio [INFERRED 0.85]
- **Gold/Rose-Gold Jewelry Image Set** — src_assets_pr_ear1, src_assets_pr_neck1, src_assets_pr_ring1, concept_jewelry_category [INFERRED 0.85]
- **Legacy Korean Skincare .bd Identity (gold droplet favicon + logo + tagline)** — public_logo_svg, public_favicon_svg, public_logo_droplet_sparkle_emblem, public_logo_korean_skincare_brand, public_logo_authentic_seoul_beauty_tagline [INFERRED 0.85]
- **Noor's Elegance Product Image Catalog (pr-* assets)** — src_assets_pr_bag1, src_assets_pr_bag2, src_assets_pr_ear1, src_assets_pr_neck1, src_assets_pr_ring1, src_assets_pr_scarf1, src_assets_pr_watch1 [INFERRED 0.85]
- **Shop-by-Category Image Set (bags, earrings, necklaces, rings, sunglasses, watches)** — src_assets_cat_bags, src_assets_cat_earrings, src_assets_cat_necklaces, src_assets_cat_rings, src_assets_cat_sunglasses, src_assets_cat_watches [INFERRED 0.85]
- **Noor's Elegance Product Category Taxonomy** — src_assets_cat_bags_bags_category, src_assets_cat_earrings_earrings_category, src_assets_cat_necklaces_necklaces_category, src_assets_cat_rings_rings_category, src_assets_cat_sunglasses_sunglasses_category, src_assets_cat_watches_watches_category [INFERRED 0.85]
- **Theming, Dark Mode & Contrast Guidance Across UI Skills** — agents_skills_ui_styling_references_shadcn_theming_dark_mode_next_themes, agents_skills_ui_styling_references_shadcn_theming_css_variable_system, agents_skills_ui_styling_references_tailwind_customization_dark_mode_configuration, agents_skills_ui_styling_references_shadcn_accessibility_color_contrast, agents_skills_ui_ux_pro_max_skill_light_dark_mode_contrast [INFERRED 0.85]

## Communities (172 total, 41 thin omitted)

### Community 0 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (29): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict. (+21 more)

### Community 1 - "scripts/core.py"
Cohesion: 0.17
Nodes (19): _exact_match_diagnostic(), _exact_stack_identifier(), _load_rows_or_empty(), _passes_threshold(), _project_row(), _query_coverage(), UI/UX Pro Max Core - BM25 search engine for UI/UX style guides, Nearest known vocabulary terms for a query that returned 0 hits, so the caller… (+11 more)

### Community 2 - "validate_data.py"
Cohesion: 0.07
Nodes (51): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+43 more)

### Community 3 - "dependencies"
Cohesion: 0.03
Nodes (61): dependencies, bcryptjs, better-auth, class-variance-authority, cloudinary, clsx, cmdk, date-fns (+53 more)

### Community 4 - "cn"
Cohesion: 0.05
Nodes (62): @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-menubar, @radix-ui/react-select, AccordionContent, AccordionItem, AccordionTrigger (+54 more)

### Community 5 - "connectDB"
Cohesion: 0.07
Nodes (40): warmUpDatabase(), register(), changePassword, getAllUsers, getUserById, loginUser, registerUser, updateProfile (+32 more)

### Community 6 - "generate-slide.py"
Cohesion: 0.13
Nodes (21): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+13 more)

### Community 7 - "lucide-react"
Cohesion: 0.04
Nodes (62): AdminDashboardClient(), AdminDashboardClientProps, AdminOrderStats, AdminProductStats, AdminSummary, AdminUserRow, AiStudioModule, ApiWebhooksHealthModule (+54 more)

### Community 8 - "site-data.ts"
Cohesion: 0.08
Nodes (26): AboutPage(), RouteParams, SingleSegmentPage(), TrackOrderPage(), WishlistPage(), ImageSource, ADMIN_MODULES, AdminModule (+18 more)

### Community 9 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 10 - "sidebar.tsx"
Cohesion: 0.06
Nodes (46): @radix-ui/react-separator, @radix-ui/react-tooltip, Input, Separator, src_components_ui_sheet_sheet, SheetContent, SheetContentProps, SheetDescription (+38 more)

### Community 11 - "ProductEditor.tsx"
Cohesion: 0.10
Nodes (46): Brand, BrandForm(), BrandManagerModule(), EMPTY, FormState, Category, CategoryForm(), CategoryManagerModule() (+38 more)

### Community 12 - "serverError"
Cohesion: 0.13
Nodes (33): DELETE(), GET(), keepOneDefault(), POST(), PUT(), readAddress(), GET(), ACTIVE (+25 more)

### Community 13 - "vendors/route.ts"
Cohesion: 0.10
Nodes (30): GET(), STATUSES, GET(), DELETE(), GET(), POST(), PUT(), PUT() (+22 more)

### Community 14 - "package.json"
Cohesion: 0.05
Nodes (41): name, private, sideEffects, type, better-auth, date-fns, eslint, eslint-config-prettier (+33 more)

### Community 15 - "icon/generate.py"
Cohesion: 0.09
Nodes (31): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+23 more)

### Community 16 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 17 - "next"
Cohesion: 0.10
Nodes (47): PATCH(), POST(), PATCH(), POST(), POST(), POST(), POST(), POST() (+39 more)

### Community 18 - "seed/route.ts"
Cohesion: 0.18
Nodes (14): GET(), PUT(), handleSeed(), POST(), SEED_USERS, DEFAULT_STOREFRONT, SUPER_ADMIN_ROLES, src_server_db_models_index_coupon (+6 more)

### Community 19 - "carousel.tsx"
Cohesion: 0.09
Nodes (28): embla-carousel-react, @radix-ui/react-alert-dialog, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+20 more)

### Community 20 - "cip/generate.py"
Cohesion: 0.07
Nodes (40): Apparel (polo, uniforms), Core Identity (primary logo, variations), Digital Assets (social media, email signature), CIP Deliverable Guide, Office Environment (reception signage, wayfinding, wall graphics), Stationery Set (business card, letterhead, envelope), Vehicle Branding (car, fleet), CIP HTML Presentation (base64 single-file, dark theme) (+32 more)

### Community 21 - "design_system.py"
Cohesion: 0.07
Nodes (35): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+27 more)

### Community 22 - "test_design_system_mode.py"
Cohesion: 0.09
Nodes (18): _contrast_ratio(), _derive_dark_palette(), _filter_anti_patterns_for_mode(), _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces. (+10 more)

### Community 23 - "slide_search_core.py"
Cohesion: 0.08
Nodes (38): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., BM25, calculate_pattern_break() (+30 more)

### Community 24 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 25 - "server/db/models/index.ts"
Cohesion: 0.10
Nodes (37): AdminPage(), allowedRoles, dynamic, LeanUserRecord, metadata, serializeUsers(), POST(), Ctx (+29 more)

### Community 26 - "react"
Cohesion: 0.04
Nodes (43): clsx, input-otp, @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area (+35 more)

### Community 27 - "color"
Cohesion: 0.06
Nodes (31): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+23 more)

### Community 28 - "optimizedImageUrl"
Cohesion: 0.16
Nodes (13): generateMetadata(), sans, serif, viewport, OrderConfirmationPage(), LogoProps, SiteLogoLink(), cloudinaryResized() (+5 more)

### Community 29 - "(store)/layout.tsx"
Cohesion: 0.12
Nodes (28): NotFound(), CartPage(), ContactPage(), generateMetadata(), revalidate, StoreLayout(), zustand, AnnouncementBar() (+20 more)

### Community 30 - "ShadcnInstaller"
Cohesion: 0.17
Nodes (9): main(), Path, Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, Initialize installer. Args: project_root: Project root directory (default:…, ShadcnInstaller, Test getting installed components without config., Test adding components with empty list. (+1 more)

### Community 31 - "html-token-validator.py"
Cohesion: 0.06
Nodes (44): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+36 more)

### Community 32 - "TestTailwindConfigGenerator"
Cohesion: 0.07
Nodes (15): Test adding custom fonts., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test plugin recommendations., Test generating TypeScript configuration., Test generating JavaScript configuration., Test validating valid configuration., Test validating config with no content paths. (+7 more)

### Community 33 - "detect_domain"
Cohesion: 0.18
Nodes (13): _contains_phrase(), detect_domain(), _domain_keywords(), _file_signature(), _load_csv(), _load_csv_snapshot(), _load_product_keywords(), Return rows and the verified signature of the bytes they came from. (+5 more)

### Community 34 - "logo/core.py"
Cohesion: 0.19
Nodes (13): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results, Logo Design Core - BM25 search engine for logo design guidelines (+5 more)

### Community 35 - "types/index.ts"
Cohesion: 0.09
Nodes (22): HomepageSection, HomepageSectionDocument, homepageSectionSchema, AddressDocument, addressSchema, CategoryDocument, categorySchema, HomepageSectionDocument (+14 more)

### Community 36 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+17 more)

### Community 37 - "test_style_taxonomy.py"
Cohesion: 0.09
Nodes (12): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution, Regression tests for the public style taxonomy and search contract. (+4 more)

### Community 38 - "session.ts"
Cohesion: 0.15
Nodes (16): POST(), GET(), GET(), ORDER_STATUSES, PATCH(), PAYMENT_STATUSES, tokenMatches(), ref_crypto (+8 more)

### Community 39 - "backend/db/models/index.ts"
Cohesion: 0.12
Nodes (18): Address, AddressDocument, addressSchema, Analytics, AnalyticsDocument, analyticsSchema, Banner, BannerDocument (+10 more)

### Community 40 - "Brand Skill"
Cohesion: 0.08
Nodes (37): Asset Approval Checklist, Asset Approval Review & Sign-off, Brand Guidelines Template, Extractable Brand Guideline Fields, Brand Consistency Checklist, Brand Channel Audit, Logo Usage Rules, Logo Clear Space & Minimum Size (+29 more)

### Community 41 - "product/[slug]/page.tsx"
Cohesion: 0.06
Nodes (61): GET(), GET(), GET(), BrandPage(), findBrand(), generateMetadata(), Params, SP (+53 more)

### Community 42 - "Design System Skill"
Cohesion: 0.13
Nodes (23): Brand Guidelines Starter Template, AI Image Generation Prompt Template, Design Components (Buttons, Spacing, Radius), Component Specifications, Component Tokens, Primitive Tokens, Semantic Tokens, Dark Mode Overrides (+15 more)

### Community 43 - "radius"
Cohesion: 0.12
Nodes (23): $type, $value, lg, sm, $type, $value, $type, $value (+15 more)

### Community 44 - "TailwindConfigGenerator"
Cohesion: 0.09
Nodes (12): Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value… (+4 more)

### Community 45 - "constants.ts"
Cohesion: 0.13
Nodes (14): SalesAnalyticsModule, CheckoutPage(), SalesAnalyticsModuleProps, ADMIN_PAGE_SIZE, BD_DISTRICTS, BD_DIVISIONS, CLOUDINARY_FOLDERS, COMMON_COLORS (+6 more)

### Community 46 - "BM25"
Cohesion: 0.22
Nodes (6): BM25, BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes.

### Community 47 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+14 more)

### Community 48 - "Design Skill (SKILL.md)"
Cohesion: 0.31
Nodes (9): Design Routing Guide, Multi-Skill Workflows (setup, migration, component creation), Three-Layer Token Architecture (primitive, semantic, component), Icon Design Reference, gemini-3.1-pro-preview, 12 Icon Categories, SVG Best Practices (currentColor, viewBox 24, title), Complete Brand Package Workflow (Logo -> CIP -> Presentation) (+1 more)

### Community 49 - "Slides Reference (design)"
Cohesion: 0.18
Nodes (18): Slides Create (design), Slides Reference (design), Slide Animation Classes (fade-up, scale, stagger, count), Chart.js 4.4.1 Integration, Slide CSS Token Variables (--color-primary, etc.), HTML Slide Template (design), embed-tokens.cjs output, Slide Navigation Script (showSlide/nextSlide/prevSlide, keyboard) (+10 more)

### Community 50 - "command.tsx"
Cohesion: 0.13
Nodes (18): cmdk, @radix-ui/react-dialog, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem (+10 more)

### Community 52 - "fetch-background.py"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 53 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 54 - "class-variance-authority"
Cohesion: 0.14
Nodes (15): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge() (+7 more)

### Community 55 - "validate-asset.cjs"
Cohesion: 0.18
Nodes (17): Asset Organization Guide, Asset Naming Convention, Asset Metadata Schema (manifest.json), Asset Tagging System, checkManifest(), formatBytes(), formatOutput(), fs (+9 more)

### Community 56 - "Social Photos Design Guide"
Cohesion: 0.22
Nodes (17): Social/Web/Print Banner Size Table, Routing by Question Type, Skill Dependency Chain (brand -> design-system -> ui-styling -> app code), assets-organizing skill, Social Photos Design Guide, Social HTML Design Rules (exact viewport, self-contained, no scroll), Social Platform Sizes (13 formats), project-management skill (+9 more)

### Community 57 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 58 - "uploads/route.ts"
Cohesion: 0.16
Nodes (20): authorizeUpload(), folderFrom(), GET(), POST(), ref_net, ref_path, ref_sharp, ALLOWED_TYPES (+12 more)

### Community 59 - "Droplet & Sparkle Emblem (gold #C59B6D)"
Cohesion: 0.17
Nodes (16): favicon.png - Shajgoj.bd stacked logo (S emblem over wordmark), favicon.svg - gold droplet favicon (legacy Korean Skincare), Tagline: AUTHENTIC SEOUL BEAUTY, Droplet & Sparkle Emblem (gold #C59B6D), Korean Skincare .bd Brand (legacy identity), logo.png - SHAJGOJ.bd magenta wordmark, SHAJGOJ.bd Wordmark (magenta-to-orchid gradient, bold geometric sans), logo shajgojbd.png - SHAJGOJ.bd magenta wordmark (+8 more)

### Community 60 - "VendorDashboardClient.tsx"
Cohesion: 0.11
Nodes (33): AuthHeading(), AuthPage(), CodeField(), ForgotPasswordPage(), LoginPage(), postJson(), RegisterPage(), RouteParams (+25 more)

### Community 61 - "account/page.tsx"
Cohesion: 0.15
Nodes (23): AccountPage(), Address, AddressesTab(), dateLabel(), EMPTY_ADDRESS, EmptyOrders(), Order, ORDER_FILTERS (+15 more)

### Community 62 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 63 - "form.tsx"
Cohesion: 0.18
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 64 - "backend/db/models/order.model.ts"
Cohesion: 0.14
Nodes (15): addressSubSchema, optionalAddressSubSchema, Order, OrderDocument, orderItemSchema, orderSchema, addressSubSchema, optionalAddressSubSchema (+7 more)

### Community 65 - "Banner Sizes & Art Direction Styles Reference"
Cohesion: 0.18
Nodes (15): Banner Sizes & Art Direction Styles Reference, 22 Art Direction Styles, Complete Banner Sizes (Social, Display, Website, Print), CTA Rules, Pinterest Research Queries, Print Specs (300 DPI, CMYK, bleed), Safe Zones, Text-to-Image Ratio (+7 more)

### Community 66 - "Logo AI Prompt Engineering"
Cohesion: 0.20
Nodes (11): CIP Mockup Base Prompt Structure, CIP Mockup Prompt Engineering, CIP Negative Prompts, CIP Deliverable/Style/Lighting/Context Modifiers, Logo Workflow (brief -> generate -> HTML preview), Logo AI Common Pitfalls, Logo Core Prompt Structure, Logo AI Prompt Engineering (+3 more)

### Community 67 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 68 - "TestShadcnInstaller"
Cohesion: 0.12
Nodes (9): Test adding components without shadcn config., Test adding components with overwrite flag., Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Test listing installed components without config., Test initialization with custom project root., Test checking for non-existent shadcn config. (+1 more)

### Community 69 - "test_relevance_evaluator.py"
Cohesion: 0.11
Nodes (6): Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate, importlib_util, tempfile

### Community 70 - "_normalize"
Cohesion: 0.25
Nodes (8): _legacy_successor_guidance(), _normalize(), Apply longest-first synonym substitution at token boundaries., Whether a stack query explicitly targets an older framework generation., Choose one coherent applicability generation for stack retrieval., Prefer the explicit successor row for a brand-new app on legacy-only stacks., _stack_query_requests_legacy(), _stack_row_filter()

### Community 71 - "Slides Copywriting Formulas"
Cohesion: 0.15
Nodes (17): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, Slides Copywriting Formulas, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (with emotions), PAS (Problem-Agitate-Solution), Layout Decision Flow (layout/color/typography CSVs) (+9 more)

### Community 73 - "MultiVendorModule.tsx"
Cohesion: 0.24
Nodes (14): MultiVendorModule, api(), Category, CreateVendorDialog(), date(), discountOf(), MultiVendorModule(), ReviewProduct (+6 more)

### Community 74 - "hero.jpg (Homepage hero flat-lay: rose-gold watch, flower pendant necklace, pearl earrings, stacked rings, cuff bangle, pink chain bag, perfume, lipstick)"
Cohesion: 0.18
Nodes (15): cat-bags.jpg (Bags category image: blush-pink leather mini crossbody with gold chain strap), Bags Category, cat-earrings.jpg (Earrings category image: gold hook drop earrings with double pearls on marble), Earrings Category, cat-necklaces.jpg (Necklaces category image: fine gold chain with gold bead pendant worn on neckline, cream satin), Necklaces Category, cat-rings.jpg (Rings category image: stacked rose-gold rings with pink gemstone and pave band on peach satin), Rings Category (+7 more)

### Community 75 - "extract-colors.cjs"
Cohesion: 0.15
Nodes (16): Color Palette Management, Color Brand Compliance Validation, Color System Hierarchy, WCAG 2.1 Contrast Ratios, calculateCompliance(), colorDistance(), displayPalette(), extractHexColors() (+8 more)

### Community 77 - "Enterprise Admin Operations Hub (/admin)"
Cohesion: 0.18
Nodes (13): Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *), Enterprise Admin Operations Hub (/admin), AI Studio (content generator, SEO meta optimizer, image enhancer), Coupon & Seasonal Campaign Engine (Eid, Ramadan, Pohela Boishakh), Bangladeshi Courier Integrations (Pathao, Steadfast, RedX, Paperfly, eCourier), Customer CRM & RFM Segmentation, Financial Dashboard, P&L & Report Export Center, Multi-Vendor Marketplace Module (+5 more)

### Community 78 - "primitive"
Cohesion: 0.15
Nodes (12): $type, $value, dark, semantic, primitive, $schema, $type, $value (+4 more)

### Community 80 - "breadcrumb.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 81 - "mongoose"
Cohesion: 0.15
Nodes (12): mongoose, connectDB(), MongooseCache, src_backend_db_models_index_category, src_backend_db_models_index_homepagesection, src_backend_db_models_index_product, src_backend_db_models_index_settings, src_backend_db_models_index_user (+4 more)

### Community 82 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 83 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 84 - "UI Styling Skill (SKILL.md)"
Cohesion: 0.20
Nodes (12): UI Styling Skill LICENSE (Apache 2.0), Apache License 2.0, Canvas Design System Reference, Design Movement Examples (Concrete Poetry, Chromatic Language, Geometric Silence...), Design Philosophy Approach (two-phase: philosophy then visual expression), Tailwind CSS Customization Reference, Layer Organization (@layer base/components/utilities, @apply), Tailwind Plugins (official and custom) (+4 more)

### Community 85 - "validation.ts"
Cohesion: 0.15
Nodes (32): Ctx, DELETE(), GET(), notFound(), PATCH(), PUT(), POST(), SORTS (+24 more)

### Community 86 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 87 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 88 - "pathlib"
Cohesion: 0.06
Nodes (37): Regression test for sync-brand-to-tokens.cjs. The color parser required a…, main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides., Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives. (+29 more)

### Community 89 - "chart.tsx"
Cohesion: 0.24
Nodes (11): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent (+3 more)

### Community 90 - "backend/db/models/cart.model.ts"
Cohesion: 0.18
Nodes (10): Cart, CartDocument, cartItemSchema, cartSchema, Cart, CartDocument, cartItemSchema, cartSchema (+2 more)

### Community 91 - "backend/db/models/wishlist.model.ts"
Cohesion: 0.18
Nodes (10): Wishlist, WishlistDocument, wishlistItemSchema, wishlistSchema, Wishlist, WishlistDocument, wishlistItemSchema, wishlistSchema (+2 more)

### Community 92 - "Banner Sizes & Art Direction Styles"
Cohesion: 0.15
Nodes (17): 22 Art Direction Styles, Banner CTA Rules (one CTA, bottom-right, 44px min), Banner Sizes & Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs (300 DPI, CMYK, 3-5mm bleed), Safe Zones (central 70-80% of canvas), Text-to-Image Ratio (ads under 20% text) (+9 more)

### Community 93 - "shadcn/ui Accessibility Patterns Reference"
Cohesion: 0.22
Nodes (11): shadcn/ui Accessibility Patterns Reference, Form Accessibility (labels, error handling, required fields), Keyboard Navigation & Focus Management, shadcn/ui Component Reference, Command Palette Component, Dialog / Overlay Components, Form Component (React Hook Form + Zod), Table / Data Table Component (+3 more)

### Community 94 - "backend/db/models/payment.model.ts"
Cohesion: 0.22
Nodes (7): Payment, PaymentDocument, paymentSchema, Payment, PaymentDocument, paymentSchema, IPayment

### Community 95 - "UserRole"
Cohesion: 0.22
Nodes (8): User, UserDocument, userSchema, RequireAuthOptions, AuthUser, userSchema, IUser, UserRole

### Community 96 - "backend/db/models/product.model.ts"
Cohesion: 0.20
Nodes (9): Product, ProductDocument, productSchema, productVariantSchema, ProductDocument, productSchema, productVariantSchema, IProduct (+1 more)

### Community 97 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 98 - "duration"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 99 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 100 - "update-passwords.mjs"
Cohesion: 0.27
Nodes (9): ACCOUNTS, DRY_RUN, env(), envVars, generatePassword(), LEGACY_DEMO_EMAILS, main(), mongoUri (+1 more)

### Community 101 - "backend/db/models/notification.model.ts"
Cohesion: 0.22
Nodes (8): Notification, NotificationDocument, notificationSchema, Notification, NotificationDocument, notificationSchema, INotification, NotificationType

### Community 102 - "Logo Design Reference"
Cohesion: 0.12
Nodes (18): Logo Design Reference, Gemini Nano Banana Models, Logo Styles Catalog (55+ styles), format_brief(), format_results(), main(), Format search results for display, CIP Design Search CLI - Search corporate identity design guidelines (+10 more)

### Community 103 - "ref_fs"
Cohesion: 0.12
Nodes (11): ref_dns, ref_fs, nodemailer, ref_populate_expanded_catalog_mjs, ACCESSORIES, CATEGORIES, PRODUCTS, env (+3 more)

### Community 104 - "(store)/page.tsx"
Cohesion: 0.09
Nodes (34): CategoryCard(), HeroSection(), HomePage(), LARGE_IMAGE_WIDTHS, ProductSection(), revalidate, SectionHeading(), TRUST_ICON_COMPONENTS (+26 more)

### Community 105 - "ui-ux-pro-max Skill (SKILL.md)"
Cohesion: 0.22
Nodes (9): Screen Reader Support (ARIA labels, live regions, sr-only), Tailwind CSS Utility Reference, Arbitrary Values, Layout Utilities (Flexbox, Grid, Positioning), Tailwind Spacing Scale, ui-ux-pro-max Skill (SKILL.md), Phosphor Icons Default (Heroicons fallback, no emoji icons), Pre-Delivery Checklist (visual, interaction, light/dark, layout, accessibility) (+1 more)

### Community 106 - ".test_add_all_components_success"
Cohesion: 0.22
Nodes (5): Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 107 - "test_tailwind_config_gen.py"
Cohesion: 0.16
Nodes (10): main(), Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object() (+2 more)

### Community 108 - "search.py (design intelligence search CLI)"
Cohesion: 0.22
Nodes (9): shadcn/ui Component Layer, Tailwind CSS Styling Layer, Available Stacks (nextjs, shadcn, html-tailwind, react, ...), Query Contract (one dominant intent, 2-5 terms, retry once), Search Domains (product, style, color, typography, ux, gsap, react, icons...), search.py (design intelligence search CLI), README: koreanskincare.bd Enterprise E-Commerce Platform, koreanskincare.bd Storefront & Management System (+1 more)

### Community 109 - "navigation-menu.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 110 - "_row_identities"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 111 - "_search_csv_detailed"
Cohesion: 0.33
Nodes (6): _get_bm25(), Fitted index with cache identity covering fields and scorer version., Calibrated search returning results, index, and internal diagnostics., Backward-compatible internal search tuple used by existing callers/tests., _search_csv(), _search_csv_detailed()

### Community 112 - "drawer.tsx"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 113 - "seed-catalog.mjs"
Cohesion: 0.20
Nodes (11): BRANDS, CATEGORIES, HOW_TO_USE, IMAGES, PRODUCTS, RETIRED_CATEGORY_SLUGS, SUBCATEGORY_OVERRIDES, DRY_RUN (+3 more)

### Community 114 - "StorefrontModule.tsx"
Cohesion: 0.12
Nodes (25): Card(), FooterEditor(), HomepageEditor(), ImageField(), Load, ResetLink(), Section, SECTIONS (+17 more)

### Community 115 - "backend/db/models/coupon.model.ts"
Cohesion: 0.25
Nodes (7): Coupon, CouponDocument, couponSchema, CouponDocument, couponSchema, CouponType, ICoupon

### Community 117 - "backend/db/models/review.model.ts"
Cohesion: 0.22
Nodes (7): Review, ReviewDocument, reviewSchema, Review, ReviewDocument, reviewSchema, IReview

### Community 118 - "server/db/models/analytics.model.ts"
Cohesion: 0.40
Nodes (4): Analytics, AnalyticsDocument, analyticsSchema, IAnalyticsEvent

### Community 119 - "shadcn/ui Theming & Customization Reference"
Cohesion: 0.25
Nodes (8): Color Contrast Requirements, shadcn/ui Theming & Customization Reference, Component Variant Customization, CSS Variable Theme System, Dark Mode Setup with next-themes, Tailwind Dark Mode Configuration, @theme Directive (custom design tokens), Light/Dark Mode Contrast Rules (4.5:1 text, token-driven theming)

### Community 120 - "error-capture.ts"
Cohesion: 0.32
Nodes (4): describeError(), describeStatus(), originalConsoleError, safeStringify()

### Community 121 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, images:migrate, lint, seed, start

### Community 122 - "Logo Color Psychology"
Cohesion: 0.12
Nodes (17): CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, etc.), CIP Color Psychology Table, CIP Design Style Guide, Luxury Premium Style (black, gold, serif), Color Accessibility (WCAG AA 4.5:1), Color Combinations by Industry, Color Harmony Types (mono, complementary, analogous, triadic), Logo Color Psychology (+9 more)

### Community 123 - "Design System Generation (--design-system)"
Cohesion: 0.33
Nodes (6): Multi-Page Design Systems, Design Dials (--variance, --motion, --density), Design System Generation (--design-system), GSAP Animation Presets, Master + Overrides Persistence Pattern (MASTER.md + pages/), ui-reasoning.csv (reasoning rules)

### Community 125 - "Soft Neutral/Blush Product Photography Style (warm light, cream and pink backdrops, rose-gold accents)"
Cohesion: 0.21
Nodes (12): Handbags Product Category, Jewelry Product Category (Earrings, Necklaces, Rings), Scarves Product Category, Soft Neutral/Blush Product Photography Style (warm light, cream and pink backdrops, rose-gold accents), Watches Product Category, pr-bag1.jpg - Woven Straw Tote Bag with Tan Leather Handles, pr-bag2.jpg - Black Quilted Leather Crossbody Bag with Gold Chain, pr-ear1.jpg - Rose Gold Hoop Earrings with Pearl Drops (+4 more)

### Community 126 - "lovable-error-reporting.ts"
Cohesion: 0.40
Nodes (3): LovableErrorOptions, LovableEvents, Window

### Community 127 - "skuPrefix"
Cohesion: 0.67
Nodes (4): brandCode(), categoryCode(), skuPrefix(), words()

### Community 128 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 129 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 130 - "Tailwind CSS Responsive Design Reference"
Cohesion: 0.67
Nodes (4): Tailwind CSS Responsive Design Reference, Breakpoint System (sm, md, lg, xl, 2xl), Container Queries, Mobile-First Approach

### Community 131 - "UI Styling scripts requirements.txt"
Cohesion: 0.67
Nodes (4): UI Styling scripts requirements.txt, pytest (with pytest-cov, pytest-mock), UI Styling tests requirements.txt, shadcn_add.py (component installer script)

### Community 133 - "primary-hover"
Cohesion: 0.67
Nodes (3): primary-hover, $type, $value

### Community 134 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 167 - "migrate-images-to-cloudinary.mjs"
Cohesion: 0.33
Nodes (7): cloudinary, DRY_RUN, loadEnv(), localImages(), main(), publicIdFor(), upload()

### Community 168 - "backend/db/models/blog.model.ts"
Cohesion: 0.22
Nodes (7): Blog, BlogDocument, blogSchema, Blog, BlogDocument, blogSchema, IBlog

### Community 171 - "server/db/models/banner.model.ts"
Cohesion: 0.40
Nodes (4): Banner, BannerDocument, bannerSchema, IBanner

## Ambiguous Edges - Review These
- `Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)` → `Enterprise Admin Operations Hub (/admin)`  [AMBIGUOUS]
  public/robots.txt · relation: conceptually_related_to
- `Apache License 2.0` → `UI Styling Skill (SKILL.md)`  [AMBIGUOUS]
  .agents/skills/ui-styling/SKILL.md · relation: conceptually_related_to
- `UI Styling scripts requirements.txt` → `UI Styling tests requirements.txt`  [AMBIGUOUS]
  .agents/skills/ui-styling/scripts/tests/requirements.txt · relation: conceptually_related_to
- `Droplet & Sparkle Emblem (gold #C59B6D)` → `Pink/Gold Offset Ring Emblem (pink upper arc, gold lower arc forming an S-like ring)`  [AMBIGUOUS]
  public/shajgoj.bd final.png · relation: conceptually_related_to

## Knowledge Gaps
- **618 isolated node(s):** `name`, `private`, `sideEffects`, `type`, `dev` (+613 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1096 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Crawler Allow-All Policy (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)` and `Enterprise Admin Operations Hub (/admin)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Apache License 2.0` and `UI Styling Skill (SKILL.md)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `UI Styling scripts requirements.txt` and `UI Styling tests requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Droplet & Sparkle Emblem (gold #C59B6D)` and `Pink/Gold Offset Ring Emblem (pink upper arc, gold lower arc forming an S-like ring)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `next` connect `next` to `session.ts`, `lucide-react`, `(store)/page.tsx`, `product/[slug]/page.tsx`, `site-data.ts`, `serverError`, `vendors/route.ts`, `VendorDashboardClient.tsx`, `constants.ts`, `package.json`, `blog/[slug]/page.tsx`, `seed/route.ts`, `account/page.tsx`, `validation.ts`, `server/db/models/index.ts`, `uploads/route.ts`, `optimizedImageUrl`, `(store)/layout.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `cn`, `lucide-react`, `site-data.ts`, `sidebar.tsx`, `ProductEditor.tsx`, `package.json`, `blog/[slug]/page.tsx`, `carousel.tsx`, `optimizedImageUrl`, `(store)/layout.tsx`, `product/[slug]/page.tsx`, `constants.ts`, `command.tsx`, `class-variance-authority`, `VendorDashboardClient.tsx`, `account/page.tsx`, `form.tsx`, `MultiVendorModule.tsx`, `breadcrumb.tsx`, `chart.tsx`, `(store)/page.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `StorefrontModule.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._