'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { X, RotateCcw, PenTool, Loader2 } from 'lucide-react'

interface Props {
  contractRef?: string
  onConfirm: (dataUrl: string) => void
  onClose: () => void
  loading?: boolean
}

export function SignatureModal({ contractRef, onConfirm, onClose, loading = false }: Props) {
  const padRef = useRef<SignatureCanvas>(null)
  const [empty, setEmpty] = useState(true)

  function handleClear() {
    padRef.current?.clear()
    setEmpty(true)
  }

  function handleConfirm() {
    if (!padRef.current || padRef.current.isEmpty()) return
    onConfirm(padRef.current.toDataURL('image/png'))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0d1117] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <PenTool className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Sign Contract</h2>
              {contractRef && (
                <p className="text-[11px] text-gray-600 font-mono">{contractRef}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Draw your signature using mouse or touch:</p>
            <button
              onClick={handleClear}
              disabled={loading || empty}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-all disabled:opacity-30"
            >
              <RotateCcw className="h-2.5 w-2.5" />Clear
            </button>
          </div>

          {/* White canvas — signature pad */}
          <div
            className="rounded-xl border-2 border-dashed border-white/[0.12] bg-white overflow-hidden cursor-crosshair relative"
            style={{ touchAction: 'none' }}
          >
            <SignatureCanvas
              ref={padRef}
              penColor="#111827"
              minWidth={1.5}
              maxWidth={2.5}
              canvasProps={{
                style: { width: '100%', height: '160px', display: 'block' },
              }}
              onBegin={() => setEmpty(false)}
            />
            {empty && (
              <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                <p className="text-xs text-gray-400/60 italic">Sign here</p>
              </div>
            )}
          </div>

          {/* Baseline */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 border-t border-dashed border-white/[0.08]" />
            <p className="text-[10px] text-gray-700 uppercase tracking-widest">Signature line</p>
            <div className="flex-1 border-t border-dashed border-white/[0.08]" />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={empty || loading}
            className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/30"
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving signature…</>
              : <><PenTool className="h-3.5 w-3.5" />Confirm Signature</>}
          </button>
          <p className="text-[11px] text-gray-700 text-center mt-2.5">
            By confirming, you legally bind this contract with your digital signature.
          </p>
        </div>
      </div>
    </div>
  )
}
