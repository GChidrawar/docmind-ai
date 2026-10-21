import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from './AuthLayout'
import { validateEmail, validateExistingPassword, validateNewPassword, validateUserName } from './validation'
import TextField from '../../components/ui/TextField'
import { notify } from '../../lib/notify'
import { authApi } from '../../services'
import { toApiError } from '../../services/http'
import { useAuthStore } from '../../store/authStore'

type Mode = 'login' | 'register'
type Field = 'userName' | 'email' | 'password'

const copy = {
  login: {
    title: 'Sign in to your workspace',
    submit: 'Sign in',
    busy: 'Signing in…',
    switchText: "Don't have an account?",
    switchLabel: 'Create one',
    switchTo: '/register',
  },
  register: {
    title: 'Create your account',
    submit: 'Create account',
    busy: 'Creating account…',
    switchText: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/login',
  },
} as const

/** Shared by /login and /register. */
export default function AuthForm({ mode }: { mode: Mode }) {
  const c = copy[mode]
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ userName: '', email: '', password: '' })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const errors: Record<Field, string> = {
    userName: validateUserName(values.userName),
    email: mode === 'register' ? validateEmail(values.email) : '',
    password: mode === 'register' ? validateNewPassword(values.password) : validateExistingPassword(values.password),
  }
  // Show a field's error once it was left or after a submit attempt, not while the user is still typing.
  const shown = (f: Field) => (touched[f] || submitted ? errors[f] : '')
  const bind = (f: Field) => ({
    value: values[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setValues((v) => ({ ...v, [f]: e.target.value })); setFormError('') },
    onBlur: () => setTouched((t) => ({ ...t, [f]: true })),
    error: shown(f),
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) {
      // focus the first invalid field (after one frame, once aria-invalid is rendered)
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    setFormError('')
    try {
      if (mode === 'register') {
        await authApi.register(values.userName, values.email, values.password)
        notify.success('Account created')
      }
      await login(values.userName, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' && from !== '/register' ? from : '/', { replace: true })
    } catch (err) {
      setFormError(toApiError(err).message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout title={c.title}>
      <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
        <TextField label="Username" autoComplete="username" autoFocus {...bind('userName')} />
        {mode === 'register' && <TextField label="Email" type="email" autoComplete="email" {...bind('email')} />}
        <TextField
          label="Password"
          revealable
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'register' ? '8–12 characters' : undefined}
          {...bind('password')}
          type="password"
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {formError}
          </p>
        )}

        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {busy ? c.busy : c.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        {c.switchText}{' '}
        <Link to={c.switchTo} state={location.state} replace className="rounded font-semibold text-brand hover:underline">
          {c.switchLabel}
        </Link>
      </p>
    </AuthLayout>
  )
}
