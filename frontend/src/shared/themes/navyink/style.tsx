/* eslint-disable react/no-unknown-property */

/**
 * Theme-scoped global styles for Navy Ink.
 *
 * All colour comes from the token layer (`shared/styles/navy-ink.css`); this
 * only adds motion, selection, and article typography that reads those tokens.
 */
const Style = () => {
  return (
    <style jsx global>{`
      #theme-navyink {
        --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
        --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
      }

      #theme-navyink ::selection {
        background: var(--brand-muted);
        color: var(--foreground);
      }

      /* Page transition used by the <Transition> in LayoutBase */
      .navyink-page-enter {
        transition:
          opacity 0.5s var(--ease-emphasized),
          transform 0.5s var(--ease-emphasized);
      }
      .navyink-page-enter-from {
        opacity: 0;
        transform: translateY(8px);
      }
      .navyink-page-enter-to {
        opacity: 1;
        transform: translateY(0);
      }

      /* Article typography, tuned to the ink token ramp */
      #theme-navyink .navyink-article {
        color: var(--foreground);
        font-size: 1.02rem;
        line-height: 1.75;
      }
      #theme-navyink .navyink-article a {
        color: var(--brand);
        text-decoration: underline;
        text-underline-offset: 3px;
        text-decoration-thickness: 1px;
        transition: opacity 0.15s var(--ease-standard);
      }
      #theme-navyink .navyink-article a:hover {
        opacity: 0.75;
      }
      #theme-navyink .navyink-article h1,
      #theme-navyink .navyink-article h2,
      #theme-navyink .navyink-article h3 {
        color: var(--foreground);
        font-weight: 650;
        letter-spacing: -0.01em;
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
