import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/Footer'

export default function Offline() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', backgroundColor: '#f3f4f6', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <svg style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 00-12.728 0M15.536 8.464a5 5 0 00-7.072 0M12 13a2 2 0 100 4 2 2 0 000-4z" />
                <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} strokeLinecap="round" />
            </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#000000' }}>You are offline</h2>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '24rem', margin: '0 auto 2rem auto' }}>Connection looks unstable. Check your network or go buy Data 😂</p>
        <Link href="/" scroll={false}>
          <Button variant="primary" style={{ height: '3rem', padding: '0 2rem', fontSize: '1.125rem', borderRadius: '9999px', backgroundColor: '#FEC312', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Try Again
          </Button>
        </Link>
      </div>
      <Footer />
    </div>
  )
}
