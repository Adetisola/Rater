import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-8">This page could not be found.</p>
      <Link href="/app/browse">
        <Button variant="primary" className="h-12 px-8 text-lg rounded-full">
          Return Home
        </Button>
      </Link>
    </div>
  )
}
