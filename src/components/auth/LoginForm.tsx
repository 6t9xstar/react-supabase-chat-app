import { useState } from 'react'
import { signIn, resetPassword } from '../../lib/auth'
import { MessageCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      window.location.href = '/chat'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address first')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <MessageCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Apex Chat</h1>
        <p className="mt-1 text-sm text-brand-200">Internal Team Communication</p>
      </div>

      <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
        {resetSent ? (
          <div className="text-center">
            <div className="mb-4 text-3xl">📧</div>
            <p className="text-sm text-brand-100">
              Check your email for a password reset link.
            </p>
            <button
              onClick={() => setResetSent(false)}
              className="mt-4 text-sm font-medium text-brand-300 hover:text-brand-200"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-100">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apexaccuracyestimatinginc.com"
                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-100">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-100"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="text-sm text-brand-300 hover:text-brand-200 disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
