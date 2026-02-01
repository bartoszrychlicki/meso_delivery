# Plan Implementacji MESO Delivery PWA

> **Status:** W trakcie realizacji
> **Aktualna faza:** 5 - Koszyk

## Podsumowanie

Pełna implementacja aplikacji PWA do zamawiania japońskiego comfort food z dostawą. Plan obejmuje 12 faz, od setup projektu po panel operatora. Każda faza zawiera testy w Chrome.

---

## Decyzje projektowe

| Aspekt | Decyzja |
|--------|---------|
| **Supabase** | Istniejący projekt |
| **Płatności** | Mock - symulacja bez P24 na razie |
| **Obrazy produktów** | AI generated (DALL-E / podobne) |

---

## Status Faz

| Faza | Nazwa | Status |
|------|-------|--------|
| 0 | Setup projektu | ✅ Gotowe |
| 1 | Baza danych Supabase | ✅ Gotowe |
| 2 | Komponenty bazowe | ✅ Gotowe |
| 3 | Landing page | ✅ Gotowe |
| 4 | Menu i produkty | ✅ Gotowe |
| 5 | Koszyk | 🔄 W trakcie |
| 6 | Autentykacja | ⏳ Oczekuje |
| 7 | Checkout i płatności | ⏳ Oczekuje |
| 8 | Śledzenie zamówienia | ⏳ Oczekuje |
| 9 | Profil i MESO Club | ⏳ Oczekuje |
| 10 | Panel operatora | ⏳ Oczekuje |
| 11 | PWA i finalizacja | ⏳ Oczekuje |

---

## Faza 0: Setup Projektu

### Zadania
- [x] Inicjalizacja Next.js 14 z App Router
- [x] Konfiguracja TypeScript (strict mode)
- [x] Setup Tailwind CSS z design systemem MESO
- [x] Instalacja pakietów (Supabase, Zustand, React Query, etc.)
- [x] Podłączenie do projektu Supabase (.env.local)
- [x] Utworzenie struktury lib/types/stores
- [x] Podstawowa strona landing MESO

### Komendy
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npm install @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install framer-motion lucide-react
npx shadcn@latest init
```

### Pliki do utworzenia
```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
├── types/
│   ├── index.ts
│   ├── menu.ts
│   ├── order.ts
│   └── customer.ts
└── styles/
    └── globals.css (z kolorami MESO)
tailwind.config.ts (design system MESO)
.env.local
```

### Konfiguracja Tailwind (design system)
```typescript
colors: {
  meso: {
    red: { 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
    dark: { 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
    gold: { 400: '#facc15', 500: '#eab308' },
    cream: '#fef3c7',
  }
}
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  display: ['Space Grotesk', 'sans-serif'],
  japanese: ['Noto Sans JP', 'sans-serif'],
}
```

### Test Chrome - Faza 0
- [x] http://localhost:3000 ładuje się ✅
- [x] Brak błędów w konsoli ✅
- [x] Tailwind działa (kolory MESO) ✅
- [x] Responsywność mobile (390px) ✅
- [x] Responsywność desktop (1920px) ✅

---

## Faza 1: Baza Danych Supabase

### Tabele
- locations, categories, products, product_variants
- addons, product_addons
- customers, customer_addresses
- orders, order_items, promo_codes

### Test Chrome - Faza 1
- [x] Supabase Dashboard → tabele istnieją (11 tabel)
- [x] Seed data załadowany (16 produktów, 5 kategorii, 10 dodatków)
- [x] SQL query działa (weryfikacja via script)

### Zweryfikowane dane:
- 1 lokalizacja (MESO Gdańsk Długa)
- 5 kategorii (Ramen, Gyoza, Rice Bowls, Dodatki, Napoje)
- 16 produktów z cenami, alergenami, badge'ami
- 10 dodatków (jajko, chashu, spicy mayo, etc.)
- 10 wariantów produktów (rozmiary ramenów)
- 5 kodów promocyjnych
- 62 połączenia produkt-dodatek
- RLS policies skonfigurowane
- Triggery: auto-create customer, update timestamps, loyalty points

---

## Faza 2: Komponenty Bazowe

### Zadania
- [x] Setup shadcn/ui components (button, card, badge, input, dialog, sheet, sonner, etc.)
- [x] Komponenty brandingowe MESO (MesoLogo, SpiceLevel, ProductBadge)
- [x] Layout aplikacji (Header + BottomNav)
- [x] Cart Store (Zustand z persist)
- [x] Common components (LoadingSpinner, EmptyState)

### Utworzone pliki
```
src/components/
├── brand/
│   ├── MesoLogo.tsx
│   ├── SpiceLevel.tsx
│   ├── ProductBadge.tsx
│   └── index.ts
├── common/
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   └── index.ts
├── layout/
│   ├── Header.tsx
│   ├── BottomNav.tsx
│   ├── AppLayout.tsx
│   └── index.ts
└── ui/
    └── (shadcn components)

src/stores/
└── cartStore.ts

src/app/(main)/
├── layout.tsx
├── menu/page.tsx
├── cart/page.tsx
└── account/page.tsx
```

### Test Chrome - Faza 2
- [x] /menu → Header z logo MESO, lokalizacja, koszyk ✅
- [x] /menu → BottomNav widoczny na mobile (Start, Menu, Koszyk, Konto) ✅
- [x] /cart → EmptyState "Twój koszyk jest pusty" ✅
- [x] Desktop (lg+) → Header pełny, brak BottomNav ✅
- [x] Mobile (< lg) → Header uproszczony, BottomNav widoczny ✅

---

## Faza 3: Landing Page

### Zadania
- [x] Hero section z brandingiem
- [x] CTA "Zamów teraz" / "Sprawdź menu"
- [x] Informacje o lokalizacji, godzinach, dostawie
- [x] Social media links
- [x] Responsywność mobile/desktop

### Test Chrome - Faza 3
- [x] http://localhost:3002 → Landing page ✅
- [x] Przycisk "ZAMÓW TERAZ" → /menu ✅
- [x] Informacje: lokalizacja, godziny 11:00-22:00, dostawa 30-45 min ✅
- [x] Mobile: layout pionowy ✅
- [x] Desktop: layout wyśrodkowany ✅

---

## Faza 4: Menu i Produkty

### Zadania
- [x] Lista kategorii (horizontal scroll mobile, sidebar desktop)
- [x] Grid produktów (1 kolumna mobile, 2 kolumny desktop)
- [x] Karty produktów z badges (Bestseller, Signature, Vegan, New)
- [x] Strona szczegółów produktu
- [x] Wybór ostrości (SpiceLevelSelector)
- [x] Wybór wariantów (rozmiary)
- [x] Wybór dodatków z checkboxami
- [x] Przycisk "Dodaj do koszyka" z dynamiczną ceną

### Utworzone pliki
```
src/components/menu/
├── CategoryTabs.tsx
├── ProductCard.tsx
├── ProductGrid.tsx
└── index.ts

src/app/(main)/menu/
├── page.tsx
├── MenuClient.tsx
└── [slug]/
    ├── page.tsx
    └── ProductDetails.tsx
```

### Test Chrome - Faza 4
- [x] /menu → Grid produktów, kategorie ✅
- [x] Kliknięcie na kategorię → filtrowanie produktów ✅
- [x] Kliknięcie na produkt → /menu/[slug] ✅
- [x] Szczegóły: zdjęcie, opis, historia, alergeny, kalorie ✅
- [x] Wybór ostrości (🔥🔥🔥) → aktualizacja UI ✅
- [x] Wybór rozmiaru → aktualizacja ceny ✅
- [x] Dodanie dodatków → aktualizacja ceny sumarycznej ✅
- [x] "DODAJ DO KOSZYKA" → toast + badge na ikonie koszyka ✅
- [x] Desktop: sidebar z kategoriami, 2-kolumnowy grid ✅
- [x] Mobile: horizontal scroll kategorii, 1-kolumnowy grid ✅

---

## Faza 5: Koszyk

### Zadania
- [ ] Strona koszyka z listą produktów
- [ ] Edycja ilości, usuwanie produktów
- [ ] Cross-sell "Zaokrąglij zamówienie"
- [ ] Kod rabatowy
- [ ] Napiwek
- [ ] Walidacja min. wartości zamówienia (35 zł)

*(W budowie)*

---

## Faza 6-11

*(Szczegóły w pełnym planie)*

---

## Weryfikacja Końcowa

### Pełny flow testowy
1. Landing → "ZAMÓW TERAZ"
2. Menu → Dodaj Spicy Miso (🔥🔥) + Jajko
3. Menu → Dodaj Karaage Rice Teriyaki
4. Koszyk → Kod "PIERWSZYRAMEN" → -15%
5. Koszyk → "ZAMÓW"
6. Login/Register
7. Checkout → Adres → BLIK (mock)
8. /orders/[id] → Tracking
9. Operator panel → Zmień status
10. Klient → Status aktualizuje się

### Testy responsywności
- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

### PWA checklist
- [ ] Manifest valid
- [ ] Service worker
- [ ] Offline support
- [ ] Installable
