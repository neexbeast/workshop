import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Pojednostavite Upravljanje Vašim Servisom
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Pratite servise, upravljajte klijentima i šaljite pravovremena podsetnika na jednom mestu. Kompletno rešenje za
              vaš auto servis.
            </p>
          </div>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/register">Započnite</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#features">Saznajte Više</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

