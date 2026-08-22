export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="z-40 w-full shrink-0 border-t border-brown/10 bg-cream/60 px-6 py-3 text-center text-xs text-brown-muted">
      © {year} Self Finance Manager. Powered by React and .NET Core
    </footer>
  )
}
