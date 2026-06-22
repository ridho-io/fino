
import { cn } from "@/lib/utils"
import { CreditCard, Wallet as WalletIcon, Plus } from "lucide-react"

interface WalletProps {
  name: string
  balance: number
  cardNumber?: string
  color?: string
  currency?: string
  locale?: string
  className?: string
}

export function WalletCard({ name, balance, cardNumber, color, currency = 'IDR', locale = 'id-ID', className }: WalletProps) {
  return (
    <div
      className={cn(
        "relative flex h-52 w-full flex-col justify-between overflow-hidden rounded-[24px] p-6 text-white shadow-xl transition-transform active:scale-95",
        className
      )}
      style={{ backgroundColor: color || "#1A312C" }}
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />

      <div className="z-10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium opacity-70">{locale.startsWith('id') ? 'Saldo' : 'Balance'}</span>
          <span className="text-2xl font-bold font-headline">
            {balance.toLocaleString(currency === 'IDR' ? 'id-ID' : locale, { 
              style: 'currency', 
              currency: currency,
              minimumFractionDigits: 0
            })}
          </span>
        </div>
        <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      <div className="z-10 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{name}</span>
          {cardNumber && (
            <span className="mt-1 text-xs font-mono tracking-widest opacity-60">
              •••• {cardNumber.slice(-4)}
            </span>
          )}
        </div>
        <div className="h-8 w-12 rounded bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm" />
      </div>
    </div>
  )
}

export function AddWalletCard() {
  return (
    <button className="flex h-52 w-full flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground transition-all hover:bg-muted/30 hover:border-muted-foreground/50">
      <div className="rounded-full bg-muted p-3">
        <Plus className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium">Tambah Dompet</span>
    </button>
  )
}
