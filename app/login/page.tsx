import { AuthForm } from '@/components/AuthForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-gray-400">Sign in to your SIRAJ account</p>
        </div>

        <AuthForm mode="login" />

        <p className="text-center text-sm text-gray-500">
          No account?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
