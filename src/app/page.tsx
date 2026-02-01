import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-meso-dark-950 text-white flex flex-col">
      {/* Desktop: Header bar (hidden on mobile) */}
      <header className="hidden lg:flex justify-between items-center px-12 py-6 border-b border-white/10">
        <div className="text-2xl font-bold font-display">MESO</div>
        <nav className="flex gap-8 text-white/70">
          <Link href="/menu" className="hover:text-white transition-colors">Menu</Link>
          <Link href="/about" className="hover:text-white transition-colors">O nas</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Kontakt</Link>
        </nav>
        <Link
          href="/login"
          className="px-6 py-2 border border-white/30 rounded-full hover:bg-white/10 transition-colors"
        >
          Zaloguj się
        </Link>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-24 py-12 lg:py-0">

        {/* Left side - Branding (desktop: left aligned, mobile: centered) */}
        <div className="flex-1 flex flex-col items-center lg:items-start lg:max-w-xl">
          {/* Logo */}
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tight mb-4 font-display">
            MESO
          </h1>

          <p className="text-meso-gold-400 text-lg lg:text-xl tracking-widest mb-8 font-display">
            SMART ASIAN COMFORT
          </p>

          {/* Tagline */}
          <div className="text-2xl md:text-3xl lg:text-4xl text-center lg:text-left font-light mb-12 leading-relaxed">
            Ramen jak z Tokio.
            <br />
            <span className="text-meso-red-500 font-semibold">
              W cenie, która ma sens.
            </span>
          </div>

          {/* CTAs - Desktop: horizontal, Mobile: vertical */}
          <div className="w-full max-w-sm lg:max-w-none flex flex-col lg:flex-row gap-4">
            <Link
              href="/menu"
              className="flex items-center justify-center px-8 h-14 lg:h-16 text-lg lg:text-xl bg-meso-red-500 hover:bg-meso-red-600 text-white rounded-lg lg:rounded-full font-semibold transition-colors"
            >
              🍜 ZAMÓW TERAZ
            </Link>

            <Link
              href="/menu"
              className="flex items-center justify-center px-8 h-12 lg:h-16 border border-white/30 text-white hover:bg-white/10 rounded-lg lg:rounded-full transition-colors lg:text-lg"
            >
              SPRAWDŹ MENU
            </Link>
          </div>

          {/* Info - Desktop: horizontal row, Mobile: vertical stack */}
          <div className="mt-12 flex flex-col lg:flex-row lg:gap-8 gap-3 text-center lg:text-left text-white/70 text-sm lg:text-base">
            <p className="flex items-center justify-center lg:justify-start gap-2">
              📍 ul. Długa 15, Gdańsk
            </p>
            <p className="flex items-center justify-center lg:justify-start gap-2">
              🕐 11:00 - 22:00
            </p>
            <p className="flex items-center justify-center lg:justify-start gap-2">
              🚚 30-45 min
            </p>
          </div>
        </div>

        {/* Right side - Hero image placeholder (desktop only) */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="relative w-96 h-96">
            {/* Decorative circles */}
            <div className="absolute inset-0 rounded-full bg-meso-red-500/20 animate-pulse" />
            <div className="absolute inset-8 rounded-full bg-meso-red-500/30" />
            <div className="absolute inset-16 rounded-full bg-meso-dark-800 flex items-center justify-center">
              <span className="text-8xl">🍜</span>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🥢</div>
            <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce delay-300">🥟</div>
          </div>
        </div>
      </main>

      {/* Footer - Desktop: more elaborate, Mobile: simple */}
      <footer className="py-6 lg:py-8 lg:px-12 border-t border-white/10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex justify-center gap-6 text-white/50">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">TikTok</a>
            <a href="#" className="hidden lg:inline hover:text-white transition-colors">Facebook</a>
          </div>

          {/* Desktop only: additional footer links */}
          <div className="hidden lg:flex gap-6 text-white/50 text-sm">
            <a href="#" className="hover:text-white transition-colors">Regulamin</a>
            <a href="#" className="hover:text-white transition-colors">Polityka prywatności</a>
            <a href="#" className="hover:text-white transition-colors">Dla restauracji</a>
          </div>

          <p className="text-white/30 text-xs lg:text-sm">
            © 2026 MESO. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  )
}
