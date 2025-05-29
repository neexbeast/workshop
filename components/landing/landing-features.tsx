import { Car, Users, Calendar, Bell, BarChart, Shield } from "lucide-react"

export function LandingFeatures() {
  const features = [
    {
      icon: <Car className="h-10 w-10" />,
      title: "Upravljanje Vozilima",
      description: "Pratite sve detalje vozila uključujući VIN, marku, model i istoriju servisa.",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Baza Klijenata",
      description: "Održavajte sveobuhvatnu bazu svih vaših klijenata i njihovih vozila.",
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: "Praćenje Servisa",
      description: "Beležite sve izvršene servise, uključujući delove, rad i kilometražu.",
    },
    {
      icon: <Bell className="h-10 w-10" />,
      title: "Podsetnici za Servis",
      description: "Automatska email obaveštenja za predstojeće servise na osnovu vremena ili kilometraže.",
    },
    {
      icon: <BarChart className="h-10 w-10" />,
      title: "Poslovna Analitika",
      description: "Dobijte uvid u performanse vašeg servisa kroz detaljne izveštaje.",
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Siguran Pristup",
      description: "Kontrola pristupa zasnovana na ulogama za administratore, radnike i klijente.",
    },
  ]

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Sve Što Vam Je Potrebno za Upravljanje Vašim Servisom
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Naše sveobuhvatno rešenje pruža sve alate koji su vam potrebni za efikasno vođenje servisa.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="text-primary">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

