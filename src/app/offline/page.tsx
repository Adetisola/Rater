import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/Footer'

export default function Offline() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 00-12.728 0M15.536 8.464a5 5 0 00-7.072 0M12 13a2 2 0 100 4 2 2 0 000-4z" />
                <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} strokeLinecap="round" />
            </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-black">You are offline</h2>
        <p className="text-lg text-gray-500 mb-8 max-w-sm">Connection looks unstable. Check your network or go buy Data 😂</p>
        <Link href="/" scroll={false}>
          <Button variant="primary" className="h-12 px-8 text-lg rounded-full">
            Try Again
          </Button>
        </Link>
      </div>
      <Footer />
    </div>
  )
}
