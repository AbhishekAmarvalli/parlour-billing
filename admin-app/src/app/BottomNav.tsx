import { NavLink } from 'react-router-dom'
import { ChartIcon, HomeIcon, PlusIcon, ReceiptIcon } from '../ui/icons'

// Plain words only: Home, New Bill, Bills, Reports. DESIGN.md 7.
const items = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/new-bill', label: 'New Bill', Icon: PlusIcon, end: false },
  { to: '/log', label: 'Bills', Icon: ReceiptIcon, end: false },
  { to: '/reports', label: 'Reports', Icon: ChartIcon, end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-19 items-stretch">
        {items.map(({ to, label, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-full flex-col items-center justify-center gap-0.5 text-xs font-bold ${
                  isActive ? 'text-rose' : 'text-muted'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
