export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full shrink-0 border-t border-brown/10 bg-cream/60 px-4 py-4 text-center text-xs text-brown-muted lg:px-6 lg:py-3">
      <p className="mx-auto max-w-full break-words">
        © {year} Self Finance Manager. Powered by React and .NET Core
      </p>
    </footer>
  )
}
