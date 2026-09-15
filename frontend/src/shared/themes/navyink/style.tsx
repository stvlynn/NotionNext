/* eslint-disable react/no-unknown-property */

/**
 * Theme-scoped global styles for Navy Ink.
 *
 * All colour comes from the token layer (`shared/styles/navy-ink.css`); this
 * only adds motion, selection, and the article reading typography that reads
 * those tokens. Notion block rules in `notion.css` are overridden here under
 * the `#theme-navyink .navyink-article` scope, matching `!important` only
 * where `notion.css` itself uses it.
 */
const Style = () => {
  return (
    <style jsx global>{`
      #theme-navyink {
        --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
        --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
        --article-block-gap: 0.75rem;
        --article-section-gap: 2.75rem;
      }

      #theme-navyink ::selection {
        background: var(--brand-muted);
        color: var(--foreground);
      }

      /* ------------------------------------------------------------------ */
      /* Reading column                                                      */
      /* ------------------------------------------------------------------ */

      /* Side gutters keep the measure near 70 Latin / 40 CJK characters. */
      #theme-navyink .navyink-article-column {
        padding-inline: clamp(0.25rem, 4vw, 2.5rem);
      }

      /* Prose colour is owned by --fg-color in notion.css. */
      #theme-navyink .navyink-article {
        font-size: 1.0625rem;
        line-height: 1.8;
        letter-spacing: 0.005em;
      }
      #theme-navyink .navyink-article .notion {
        font-size: inherit;
        line-height: inherit;
      }

      /* Paragraph rhythm: one gap between blocks, no padding inside them. */
      #theme-navyink .navyink-article .notion > * {
        padding: 0;
      }
      #theme-navyink .navyink-article .notion-text {
        padding: 0 !important;
        margin: var(--article-block-gap) 0 !important;
      }
      #theme-navyink .navyink-article .notion-block,
      #theme-navyink .navyink-article .notion-toggle {
        padding: 0;
        margin: var(--article-block-gap) 0;
      }
      #theme-navyink .navyink-article .notion-blank {
        min-height: var(--article-block-gap);
        padding: 0;
        margin: 0;
      }

      /* Headings: more air above than below, so they attach to what follows. */
      #theme-navyink .navyink-article .notion-h {
        padding: 0;
        font-weight: 650;
        letter-spacing: -0.015em;
        line-height: 1.3;
        scroll-margin-top: 6rem;
      }
      #theme-navyink .navyink-article .notion-h1 {
        font-size: 1.625em;
        line-height: 1.25;
        margin-top: calc(var(--article-section-gap) + 0.5rem);
        margin-bottom: 1rem;
      }
      #theme-navyink .navyink-article .notion-h2 {
        font-size: 1.3125em;
        margin-top: var(--article-section-gap);
        margin-bottom: 0.75rem;
      }
      #theme-navyink .navyink-article .notion-h3 {
        font-size: 1.125em;
        margin-top: calc(var(--article-section-gap) - 0.75rem);
        margin-bottom: 0.5rem;
      }
      #theme-navyink .navyink-article .notion-h4 {
        font-size: 1.0625em;
        margin-top: calc(var(--article-section-gap) - 1rem);
        margin-bottom: 0.5rem;
      }
      #theme-navyink .navyink-article .notion-h + .notion-h {
        margin-top: 1rem;
      }
      #theme-navyink
        .navyink-article
        .notion-page-content-inner
        > .notion-h:first-child {
        margin-top: 0.5rem;
      }
      #theme-navyink .navyink-article .notion-hash-link {
        fill: var(--muted-foreground);
        transition: opacity 0.15s var(--ease-standard);
      }

      /* Lists */
      #theme-navyink .navyink-article .notion-list {
        margin-block: var(--article-block-gap);
      }
      #theme-navyink .navyink-article .notion-list li {
        padding-block: 0.2em;
      }
      #theme-navyink .navyink-article .notion-list li::marker {
        color: var(--muted-foreground);
      }

      /* Quotes: serif, a size up, on a cornflower rail. */
      #theme-navyink .navyink-article .notion-quote {
        font-family: var(--font-serif);
        font-size: 1.125em;
        line-height: 1.7;
        color: color-mix(
          in srgb,
          var(--foreground) 85%,
          var(--muted-foreground)
        );
        border-left: 2px solid var(--brand);
        padding: 0.25em 0 0.25em 1.25em;
        margin: 1.75rem 0;
      }
      #theme-navyink .navyink-article .notion-quote .notion-text {
        margin: 0.5rem 0 !important;
      }

      /* Callouts */
      #theme-navyink .navyink-article .notion-callout {
        margin: 1.5rem 0;
        padding: 1rem 1.125rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--muted);
        font-size: 0.9375em;
        line-height: 1.7;
      }
      #theme-navyink .navyink-article .notion-callout-text .notion-text {
        line-height: inherit !important;
      }

      /* Rules and media */
      #theme-navyink .navyink-article .notion-hr {
        margin: var(--article-section-gap) auto;
        width: 3rem;
        border-top: 1px solid var(--border-strong) !important;
      }
      #theme-navyink .navyink-article .notion-asset-wrapper {
        margin: 1.75rem 0;
      }
      #theme-navyink .navyink-article .notion-asset-wrapper img {
        border-radius: var(--radius-md);
      }

      /* Code */
      #theme-navyink .navyink-article .notion .notion-code {
        margin: 1.5rem 0;
        border-radius: var(--radius-md);
        font-size: 0.875em;
        line-height: 1.7;
      }
      #theme-navyink .navyink-article .notion-inline-code {
        color: var(--foreground);
        background: var(--muted);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 0.1em 0.35em;
        font-size: 0.875em;
      }

      /* Links: a faint underline that fills in from the left on hover. */
      #theme-navyink
        .navyink-article
        :is(
          .notion-text,
          .notion-list,
          .notion-quote,
          .notion-callout-text,
          .notion-simple-table
        )
        a:not(.notion-page-link) {
        color: var(--brand);
        opacity: 1;
        text-decoration: none;
        border-bottom: 0 !important;
        background-image:
          linear-gradient(var(--brand), var(--brand)),
          linear-gradient(
            color-mix(in srgb, var(--brand) 35%, transparent),
            color-mix(in srgb, var(--brand) 35%, transparent)
          );
        background-repeat: no-repeat;
        background-size:
          0 1px,
          100% 1px;
        background-position:
          0 100%,
          0 100%;
        transition: background-size 0.3s var(--ease-emphasized);
      }
      #theme-navyink
        .navyink-article
        :is(
          .notion-text,
          .notion-list,
          .notion-quote,
          .notion-callout-text,
          .notion-simple-table
        )
        a:not(.notion-page-link):hover {
        background-size:
          100% 1px,
          100% 1px;
      }

      /* Blocks below the fold rise into place as they scroll in. The marks
         are set by useRevealOnScroll; without it every block is at rest. */
      #theme-navyink .navyink-article [data-navyink-reveal='out'] {
        opacity: 0;
        transform: translateY(10px);
      }
      #theme-navyink .navyink-article [data-navyink-reveal='in'] {
        opacity: 1;
        transform: none;
        transition:
          opacity 0.45s var(--ease-emphasized),
          transform 0.45s var(--ease-emphasized);
      }

      /* Reduced-motion: collapse enter transforms and card stagger */
      @media (prefers-reduced-motion: reduce) {
        #theme-navyink * {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  )
}

export { Style }
