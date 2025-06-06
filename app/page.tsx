import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHeader } from "@/components/landing/landing-header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  )
}