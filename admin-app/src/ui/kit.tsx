// Shared pieces from DESIGN.md 5: main button, secondary button, choice pill, input,
// list row, summary card. Buttons at least 48 px, text at least 16 px (RULES B5).

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'main' | 'secondary'
  tall?: boolean
}

export function Button({ variant = 'main', tall = false, className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl text-lg font-extrabold transition active:scale-[0.98] disabled:opacity-50'
  const height = tall ? 'min-h-16 px-6 py-4' : 'min-h-13 px-5 py-3'
  const look =
    variant === 'main'
      ? 'bg-rose text-white shadow-sm'
      : 'border-[1.5px] border-ink bg-surface text-ink'
  return <button {...rest} className={`${base} ${height} ${look} ${className}`} />
}

export function Pill({
  selected,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      {...rest}
      className={`min-h-11 rounded-xl border-[1.5px] px-4 text-base font-bold ${
        selected ? 'border-ink bg-ink text-white' : 'border-inputline bg-surface text-ink'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`min-h-13 w-full rounded-xl border-[1.5px] border-inputline bg-surface px-4 text-lg text-ink placeholder:text-muted/70 focus:border-rose focus:outline-none ${className}`}
    />
  )
}

export function EmptyLine({ text }: { text: string }) {
  return <p className="px-1 py-6 text-center text-base text-muted">{text}</p>
}
