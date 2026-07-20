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
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
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
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="w-full max-w-md px-6">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <MessageCircle class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">Apex Chat</h1>
        <p class="mt-1 text-sm text-brand-200">Internal Team Communication</p>
      </div>

      <div class="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
        {resetSent ? (
          <div class="text-center">
            <div class="mb-4 text-3xl">📧</div>
            <p class="text-sm text-brand-100">
              Check your email for a password reset link.
            </p>
            <button
              onClick={() => setResetSent(false)}
              class="mt-4 text-sm font-medium text-brand-300 hover:text-brand-200"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} class="space-y-5">
            <div>
              <label htmlFor="email" class="block text-sm font-medium text-brand-100">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apexaccuracyestimatinginc.com"
                class="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" class="block text-sm font-medium text-brand-100">
                Password
              </label>
              <div class="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  class="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-100"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff class="h-4 w-4" /> : <Eye class="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              class="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
            >
              {loading ? <Loader2 class="h-4 w-4 animate-spin" /> : 'Sign in'}
            </button>

            <div class="text-center">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                class="text-sm text-brand-300 hover:text-brand-200 disabled:opacity-50"
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
