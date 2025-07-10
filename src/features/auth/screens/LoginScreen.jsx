import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-center">Vibez Citizens</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all duration-150 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
<p className="mt-2 text-center text-sm text-neutral-400">
  <a href="/forgot-password" className="text-purple-400 hover:underline">
    Forgot password?
  </a>
</p>

<p className="text-sm text-center text-neutral-400">
  Don’t have an account?{' '}
  <Link to="/register" className="text-purple-400 hover:underline">
    Register here
  </Link>
</p>

      </form>
    </div>
  )
}

export default LoginScreen
