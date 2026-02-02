import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to menu - the landing page is served from the main domain (mesofood.pl)
  // This app is meant to run on order.mesofood.pl subdomain
  redirect('/menu')
}
