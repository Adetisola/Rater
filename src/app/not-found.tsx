import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/**
 * Global 404 Not Found page.
 * Displayed when a user navigates to a route that doesn't exist.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/browse" scroll={false}>
          <Button variant="primary" className="h-12 px-8 text-lg rounded-full">
            Return to Browse
          </Button>
        </Link>
      </div>
    </div>
  )
}
