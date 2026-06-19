# Fabric Shop Extras II — Build Progress

**App:** The Fabric Shop Extras II  
**Extension:** `fabric-shop-extras`  
**Last deployed:** v41 (2026-06-09)  
**Deploy command:** `shopify app deploy --allow-updates` (always `git push` first)

---

## Blocks built so far

| Block file | Block name | Source design |
|---|---|---|
| `simple-banner-block.liquid` | Simple Banner | (existing) |
| `about-custom-block.liquid` | About Custom | (existing) |
| `design-partner-block.liquid` | Design Partner | (existing) |
| `more-by-studio-block.liquid` | More By Studio | (existing) |
| `part-of-collection-block.liquid` | Part of Collection | (existing) |
| `product-description-tags-block.liquid` | Product Description Tags | (existing) |
| `you-might-also-like-block.liquid` | You Might Also Like | (existing) |
| `large-file-note-block.liquid` | Large File Note | (existing) |
| `rights-checkbox-block.liquid` | Rights Checkbox | (existing) |
| `custom-upload-bridge-block.liquid` | Custom Upload Bridge | `the-yard-design.html` — "Print your own design" closing bridge |
| `closing-signature-block.liquid` | Closing Signature | "The fabric your idea deserves. / By the metre, on demand." |
| `yard-sample-band-block.liquid` | Yard Sample Band | `TheFabricShop_YardCatalogue_Wireframe_v9.html` — "Before you commit a metre" |
| `yard-brand-close-block.liquid` | Yard Brand Close | `TheFabricShop_YardCatalogue_Wireframe_v9.html` — "Twenty years inside the trade" |

---

## Yard Catalogue Wireframe v9 — sections status

Design file: `C:/Users/saniy/Downloads/TheFabricShop_YardCatalogue_Wireframe_v9.html`

| Section | CSS class | Status | Notes |
|---|---|---|---|
| Catalogue Header | `.cat-head` | **Not built** | Eyebrow + large serif h1 (italic em) + sub-text + stats strip (62 fabrics, 48 buttons, 36 zips, 46 notions, 3 days) |
| Print-Ready Legend | `.yard-legend` | **Not built** | Slim linen band with sage "Print-ready" pill + explanation text |
| Filter sidebar (Refine) | `.filters` | **Deferred** | Category / Fibre / Weight filters — native Shopify collection UI, not a custom block |
| Product grid | `.yard-grid` | **Deferred** | Native Shopify collection grid |
| Yard Sample Band | `.sample-band` | ✅ Done | v41 |
| Yard Brand Close | `.brand-close` | ✅ Done | v41 |
| Footer | `.sf-footer` | **Skip** | SharedChrome v10 theme-native, no override needed |

---

## Pending / next session

1. **Catalogue Header block** — `yard-catalogue-header-block.liquid`
   - Amber mono eyebrow with 22px leading line
   - Serif h1 60px: line 1 (roman) + line 2 (italic, sage)
   - Sub-paragraph (ink-soft)
   - Stats strip: up to 5 × (number + label), serif numbers 26px, mono labels
   - Bone bg, border-bottom

2. **Print-Ready Legend block** — `yard-legend-block.liquid`
   - Slim band, linen bg, border-bottom, padding 15px 36px
   - Left: sage pill "Print-ready" (bordered, 9px mono)
   - Right: inline explanation text
   - Very simple, quick build

3. **Confirm scope of Filter sidebar** — is it native collection or does it need a custom block?

---

## Key reminders

- Schema target must be `"section"` (not `"body"`) so blocks appear in the section panel, not App Embeds
- Hover colours for CTAs: use CSS custom properties set via inline style (e.g. `--ybc-cta-hover`) — same pattern as `custom-upload-bridge-block.liquid`
- Image picker pattern: `image_url: width: 800 | image_tag: loading: 'lazy', class: '...', widths: '...', sizes: '...'`
- Body text colour on dark backgrounds: use hex approximation of rgba (e.g. bone-80% ≈ `#CDCBC6`)

## Git repos

- This repo: `C:\Users\saniy\Desktop\work\Shopify\Fabric-Shop-Theme-Extras-II`
- Remote: `work:Subhajit-WisdmLabs/Fabric-Shop-Theme-Extras-II.git`
