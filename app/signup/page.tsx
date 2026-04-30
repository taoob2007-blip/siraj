import { AuthForm } from '@/components/AuthForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-gray-400">Start making smarter procurement decisions</p>
        </div>

        <AuthForm mode="signup" />

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
