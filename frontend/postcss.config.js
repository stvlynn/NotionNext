module.exports = {
  plugins: {
    // Tailwind CSS v4 ships its own PostCSS plugin and bundles autoprefixer
    // (via Lightning CSS), so the standalone `tailwindcss` and `autoprefixer`
    // plugins are no longer required.
    '@tailwindcss/postcss': {}
  }
}
