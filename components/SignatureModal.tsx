'use client'

import { useRef, useState, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import {
  X, PenTool, Loader2, CheckCircle2, ShieldCheck,
  RotateCcw, ArrowRight, RefreshCw,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'send' | 'verify' | 'sign' | 'done'

interface UpdatedContract {
  status: 'signed'
  buyer_signature: string
  signed_at: string
  signature_method: string
  signer_ip?: string
  signer_user_agent?: string
}

interface Props {
  contractId: string
  contractRef: string
  onDone: (updated: UpdatedContract) => void
  onClose: () => void
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: 'send',   label: 'Verify'    },
  { key: 'verify', label: 'Enter Code' },
  { key: 'sign',   label: 'Sign'      },
]

function StepIndicator({ current }: { current: Step }) {
  const activeIdx = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0 mb-5">
      {STEPS.map((step, i) => {
        const done    = i < activeIdx || current === 'done'
        const active  = i === activeIdx && current !== 'done'
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 text-[10px] font-bold',
                done   ? 'border-emerald-500 bg-emerald-500 text-white'              : '',
                active ? 'border-blue-400 bg-blue-400/10 text-blue-300'              : '',
                !done && !active ? 'border-white/[0.15] bg-transparent text-gray-600' : '',
              ].join(' ')}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-blue-300' : done ? 'text-emerald-400' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-4 transition-colors ${i < activeIdx ? 'bg-emerald-500/50' : 'bg-white/[0.08]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SignatureModal({ contractId, contractRef, onDone, onClose }: Props) {
  const [step, setStep]         = useState<Step>('send')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [sentTo, setSentTo]     = useState<string>('')
  const [code, setCode]         = useState('')
  const [sigEmpty, setSigEmpty] = useState(true)
  const padRef = useRef<SignatureCanvas>(null)

  const isClosable = !loading

  // ── Step 1: send OTP ────────────────────────────────────────────────────────

  const sendOtp = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}/send-otp`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setSentTo(data.sentTo ?? 'your email')
      setStep('verify')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────

  const verifyOtp = useCallback(async () => {
    if (code.length !== 6) { setError('Enter the full 6-digit code'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setStep('sign')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }, [contractId, code])

  // ── Step 3: sign ────────────────────────────────────────────────────────────

  const confirmSignature = useCallback(async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Please draw your signature first')
      return
    }
    const signature = padRef.current.toDataURL('image/png')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed', signature }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setStep('done')
      onDone({
        status:           'signed',
        buyer_signature:  data.buyer_signature ?? signature,
        signed_at:        data.signed_at ?? new Date().toISOString(),
        signature_method: data.signature_method ?? 'OTP_VERIFIED',
        signer_ip:        data.signer_ip,
        signer_user_agent: data.signer_user_agent,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign')
    } finally {
      setLoading(false)
    }
  }, [contractId, onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && isClosable && step !== 'done') onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0d1117] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Sign Contract</h2>
              <p className="text-[11px] text-gray-600 font-mono">No. {contractRef}</p>
            </div>
          </div>
          {step !== 'done' && (
            <button
              onClick={onClose}
              disabled={!isClosable}
              className="p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {step !== 'done' && <StepIndicator current={step} />}

          {/* Error */}
          {error && (
            <div className="mb-4 text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* ── Step 1: Send OTP ────────────────────────────────────────────── */}
          {step === 'send' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400">Identity Verification</p>
                <p className="text-sm text-white leading-relaxed">
                  To protect you, we'll send a 6-digit code to your account email before you can sign.
                </p>
                <p className="text-xs text-gray-600">The code expires after 10 minutes.</p>
              </div>
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold transition-all active:scale-[0.98]"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</>
                  : <><ArrowRight className="h-3.5 w-3.5" />Send Verification Code</>}
              </button>
            </div>
          )}

          {/* ── Step 2: Verify OTP ──────────────────────────────────────────── */}
          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Code sent to <span className="text-white font-medium">{sentTo}</span>. Enter it below:
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.35em] bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                autoFocus
              />

              <button
                onClick={verifyOtp}
                disabled={loading || code.length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold transition-all active:scale-[0.98]"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Verifying…</>
                  : <><CheckCircle2 className="h-3.5 w-3.5" />Verify Code</>}
              </button>

              <button
                onClick={() => { setCode(''); setError(null); sendOtp() }}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs py-2 text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30"
              >
                <RefreshCw className="h-3 w-3" />Resend code
              </button>
            </div>
          )}

          {/* ── Step 3: Signature pad ────────────────────────────────────────── */}
          {step === 'sign' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Draw your signature:</p>
                <button
                  onClick={() => { padRef.current?.clear(); setSigEmpty(true) }}
                  disabled={loading || sigEmpty}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-all disabled:opacity-30"
                >
                  <RotateCcw className="h-2.5 w-2.5" />Clear
                </button>
              </div>

              <div
                className="rounded-xl border-2 border-dashed border-white/[0.12] bg-white overflow-hidden relative"
                style={{ touchAction: 'none' }}
              >
                <SignatureCanvas
                  ref={padRef}
                  penColor="#111827"
                  minWidth={1.5}
                  maxWidth={2.5}
                  canvasProps={{ style: { width: '100%', height: '160px', display: 'block' } }}
                  onBegin={() => setSigEmpty(false)}
                />
                {sigEmpty && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                    <p className="text-xs text-gray-400/60 italic">Sign here</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-1">
                <div className="flex-1 border-t border-dashed border-white/[0.08]" />
                <p className="text-[10px] text-gray-700 uppercase tracking-widest">Signature line</p>
                <div className="flex-1 border-t border-dashed border-white/[0.08]" />
              </div>

              <button
                onClick={confirmSignature}
                disabled={sigEmpty || loading}
                className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/30"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Signing…</>
                  : <><PenTool className="h-3.5 w-3.5" />Confirm Signature</>}
              </button>
              <p className="text-[11px] text-gray-700 text-center">
                By confirming, you legally bind this contract with your OTP-verified digital signature.
              </p>
            </div>
          )}

          {/* ── Done ────────────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="py-4 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Contract Signed</p>
                <p className="text-xs text-gray-500 mt-1">
                  Verified via OTP · Signature captured and stored
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-sm px-6 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-gray-300 font-medium transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
