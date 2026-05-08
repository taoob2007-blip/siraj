import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060B14] flex items-center justify-center px-4 py-10">

      {/* Background */}
      <div className="absolute inset-0 bg-[#060B14]" />

      {/* Cyan Glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-400/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Secondary Glow */}
      <div className="absolute bottom-[-250px] right-[-150px] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-sign.png"
            alt="SIRAJ"
            className="w-[260px] md:w-[320px] h-auto object-contain select-none"
          />
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl p-7 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

          {/* Heading */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Create account
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Start making smarter procurement decisions
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <AuthForm mode="signup" />
          </div>

          {/* Footer */}
          <div className="mt-7 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700">
            © 2026 SIRAJ. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  )
}
