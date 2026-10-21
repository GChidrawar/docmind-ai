import { useId, useState, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** field error, shown under the input and linked via aria-describedby */
  error?: string
  /** adds a show/hide toggle (password fields) */
  revealable?: boolean
}

const input =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:ring-2 dark:bg-[#0b1226] dark:text-slate-100 dark:placeholder:text-slate-400'

export default function TextField({ label, error, revealable, type = 'text', className, ...rest }: Props) {
  const id = useId()
  const errorId = `${id}-error`
  const [shown, setShown] = useState(false)
  const effectiveType = revealable && shown ? 'text' : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={id}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            input,
            revealable && 'pr-11',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25'
              : 'border-slate-300 focus:border-brand focus:ring-brand/30 dark:border-slate-700',
            className,
          )}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {shown ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
