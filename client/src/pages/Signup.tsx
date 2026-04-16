import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signup, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      // Error is handled in store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 font-['Inter']">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-8 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200">
        <h2 className="mb-6 text-center text-3xl font-bold text-white">Sign Up</h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-200">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-500 py-2.5 font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.01] hover:bg-indigo-600 hover:shadow-md disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 transition-all duration-200 hover:text-indigo-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
