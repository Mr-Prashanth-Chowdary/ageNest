// src/components/Signup.jsx
import { useState } from 'react'
import { signUpAnonymous, signUpWithEmail } from '../firebase'

export default function Signup() {
  const [mode, setMode] = useState('anonymous') // 'anonymous' or 'email'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [age, setAge] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!age) {
      setErr('Age is required')
      return
    }
    setErr('')
    setLoading(true)
    try {
      if (mode === 'anonymous') {
        await signUpAnonymous()       // your backend will create an empty profile
      } else {
        if (!email.trim() || !pw) {
          throw new Error('Email & password required')
        }
        await signUpWithEmail(email.trim(), pw, age)
      }
      alert('Registration successful!')
      window.location.href = '/'     // <-- adjust to your post-signup route
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-black mb-8">
            Sign Up
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-3">
              {['anonymous','email'].map(m => (
                <label
                  key={m}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black focus:ring-2"
                  />
                  <span className="text-gray-700 group-hover:text-black transition-colors">
                    {m === 'anonymous'
                      ? 'Anonymous Registration'
                      : 'Email Registration'}
                  </span>
                </label>
              ))}
            </div>

            {/* Email Fields */}
            {mode === 'email' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 placeholder-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 placeholder-gray-400"
                />
              </div>
            )}

            {/* Age Field */}
            <input
              type="number"
              placeholder="Age"
              min="1"
              max="150"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 placeholder-gray-400"
            />

            {/* Error */}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in slide-in-from-top-1 duration-200">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering...</span>
                </div>
              ) : (
                'Register'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-white hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
