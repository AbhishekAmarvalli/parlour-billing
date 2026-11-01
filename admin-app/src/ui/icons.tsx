// Line icons, 24 px stroke. Icon-only buttons carry an accessible name (DESIGN.md 8).

interface IconProps {
  className?: string
  strokeWidth?: number
}

function base(className?: string) {
  return className ?? 'h-6 w-6'
}

export function HomeIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function ListIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={base(className)} aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChartIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={base(className)} aria-hidden="true">
      <path d="M5 20V11M12 20V4M19 20v-6" />
    </svg>
  )
}

export function DataIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  )
}

export function LockIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="3" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  )
}

export function BackspaceIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <path d="M9 5h11v14H9L3 12z" />
      <path d="m12.5 9.5 4 5m0-5-4 5" />
    </svg>
  )
}

export function ChevronLeftIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  )
}

export function ChevronRightIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  )
}

export function PlusIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={base(className)} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function GearIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function ReceiptIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)} aria-hidden="true">
      <path d="M6 3.5h12v17l-2.4-1.4-2.4 1.4-2.4-1.4L8.4 20.5 6 19.1z" />
      <path d="M9.2 8.5h5.6M9.2 12.5h5.6" />
    </svg>
  )
}

export function SearchIcon({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={base(className)} aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}
