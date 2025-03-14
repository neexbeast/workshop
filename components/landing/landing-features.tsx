import { Car, Users, Calendar, Bell, BarChart, Shield } from "lucide-react"

export function LandingFeatures() {
  const features = [
    {
      icon: <Car className="h-10 w-10" />,
      title: "Vehicle Management",
      description: "Track all vehicle details including VIN, make, model, and service history.",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Customer Database",
      description: "Maintain a comprehensive database of all your customers and their vehicles.",
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: "Service Tracking",
      description: "Record all services performed, including parts, labor, and mileage.",
    },
    {
      icon: <Bell className="h-10 w-10" />,
      title: "Service Reminders",
      description: "Automated email reminders for upcoming services based on time or mileage.",
    },
    {
      icon: <BarChart className="h-10 w-10" />,
      title: "Business Analytics",
      description: "Gain insights into your workshop's performance with detailed reports.",
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Secure Access",
      description: "Role-based access control for administrators, workers, and clients.",
    },
  ]

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Everything You Need to Manage Your Workshop
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Our comprehensive solution provides all the tools you need to run your workshop efficiently.
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

