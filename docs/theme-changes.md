# JOYIE theme changes

A record of every custom change made to this theme, newest first.

**Repo:** `shopify-joyie` (branch `divya-changes`)
**Base theme:** Expanse 10.0.1 (Archetype Themes)
**Preview theme:** https://joyie.co/?preview_theme_id=189138960562 (Shopify theme `shopify-joyie/divya-changes`)

When you add a change, put it at the top of the change list and add a section for it below.

## Change list

| Date | Change | Commits |
| --- | --- | --- |
| 2026-10-20 | [Home page hero: buttons black instead of orange](#2026-10-20-home-page-hero-button-color) | `5b7e1bb`, `1019d7b`, `ef736dc` |

---

## 2026-10-20: Home page hero button color

### What changed

The two buttons in the home page hero ("Shop Personalized Gifts" and "Find your city") are now **black with white text** instead of orange.

Other buttons on the site are unchanged.

The color is now a setting in the theme editor, not hard-coded. To change it, go to **Customize → Home page → hero section ("Turn your photos into the gift on their wall")** and edit:

- **Button color**: button background
- **Button text color**: button text

Leave both empty to go back to the theme's default button color.

### Why it was orange

The orange came from a rule in `assets/overrides.css`:

```css
[id$='__slideshow-split'] .element-button:not(.element-button--transparent) {
  --element-button-color-primary: var(--color-sale-tag);
  --element-button-color-secondary: var(--color-sale-tag-text);
  background-color: var(--color-sale-tag) !important;
  border-color: var(--color-sale-tag) !important;
  color: var(--color-sale-tag-text) !important;
}
```

- It matched only the home page hero, the section with ID `slideshow-split`.
- It painted the buttons in the sale-tag color (`#c65029`, orange).
- It used `!important`, so it overrode any other color setting.

This rule has been removed.

### Files changed

| File | Change |
| --- | --- |
| `sections/slideshow-split.liquid` | Added two color settings to the section schema: `button_color` and `button_text_color`. |
| `snippets/section.slideshow-split.liquid` | Added CSS that applies those colors to buttons inside this section only. It outputs nothing if the setting is empty. |
| `templates/index.json` | Set `button_color: #000000` and `button_text_color: #ffffff` on the home page hero (`slideshow-split`) only. |
| `assets/overrides.css` | Removed the orange `!important` rule shown above, and left a comment where it was. |

The lower split slideshow on the home page ("Customers trust JOYIE.CO", ID `slideshow-split2`) uses the same section type. It has no button color set, so it looks the same as before.

#### The CSS that applies the color

In `snippets/section.slideshow-split.liquid`, inside the section's `{% style %}` block:

```liquid
{%- if section.settings.button_color != blank -%}
  .hero--{{ section.id }} .element-button {
    --element-button-color-primary: {{ section.settings.button_color }};
    {%- if section.settings.button_text_color != blank %}
    --element-button-color-secondary: {{ section.settings.button_text_color }};
    {%- endif %}
  }
{%- endif -%}
```

The theme's buttons (`snippets/element.button.liquid`) take their background from `--element-button-color-primary` and their text color from `--element-button-color-secondary`. Setting these variables on `.hero--<section id>` changes only this section's buttons. Hover and focus shading keep working.

### Testing

1. Open the preview link and hard-refresh the page.
2. Check that both hero buttons are black with white text.
3. Check that the buttons in the "Customers trust JOYIE.CO" section and elsewhere are unchanged.
4. Hover over a hero button and check that it still shows a slight shade change.

### Commit history

| Commit | Description |
| --- | --- |
| `5b7e1bb` | Added the button color settings and set them to black on the hero. |
| `1019d7b` | Removed the orange override in `overrides.css`. The same commit added a temporary "Divya Mangla" heading to the home page. |
| `ef736dc` | Removed the temporary name heading. |
| `e194e05` | Added code comments and this doc. |

### Before merging to `main`

The live theme ("Divya - New Launch") is a separate theme in Shopify and does not have these changes. Before going live, confirm that the live theme's `assets/overrides.css` has the same orange rule. Then apply these changes there, or publish this theme.
