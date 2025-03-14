import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="w-full border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Workshop Service Manager. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            Privacy
          </Link>
          <Link href="/contact" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}

