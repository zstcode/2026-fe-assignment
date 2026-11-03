import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Info,
  Landmark,
  Moon,
  Plus,
  Search,
  Sun,
  Wallet,
  X,
} from 'lucide-react'

const icons = {
  plus: Plus,
  moon: Moon,
  sun: Sun,
  search: Search,
  arrow: ArrowRight,
  back: ArrowLeft,
  info: Info,
  wallet: Wallet,
  savings: Landmark,
  card: CreditCard,
  check: Check,
  chevron: ChevronDown,
  close: X,
  clock: Clock,
  incoming: ArrowDownLeft,
  outgoing: ArrowUpRight,
}

type IconName = keyof typeof icons

export function Icon({ name }: { name: IconName }) {
  const LucideIcon = icons[name]
  return <LucideIcon className="icon" size={20} strokeWidth={1.7} aria-hidden="true" />
}
