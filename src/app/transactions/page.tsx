
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Search, 
  Filter, 
  Coffee, 
  ShoppingBag, 
  Car, 
  Smartphone, 
  Home as HomeIcon, 
  Banknote,
  ChevronRight,
  Calendar,
  Download,
  Plus,
  Wallet as WalletIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { storage, Transaction, Wallet, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import Link from "next/link"
import { useRouter } from "next/navigation"

const CATEGORY_ICONS: Record<string, any> = {
  Food: Coffee,
  Groceries: ShoppingBag,
  Transport: Car,
  Tech: Smartphone,
  Bills: HomeIcon,
  Income: Banknote,
  Shopping: ShoppingBag,
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 text-orange-600",
  Groceries: "bg-green-100 text-green-600",
  Transport: "bg-purple-100 text-purple-600",
  Tech: "bg-blue-100 text-blue-600",
  Bills: "bg-slate-100 text-slate-600",
  Income: "bg-accent/20 text-primary",
  Shopping: "bg-blue-100 text-blue-600",
}

export default function TransactionsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isMounted, setIsMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setTransactions(storage.getTransactions())
    setWallets(storage.getWallets())
    setSettings(storage.getSettings())
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.merchant.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || tx.category.toLowerCase().includes(categoryFilter.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, categoryFilter, transactions])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, tx) => {
      const date = tx.date
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
      return groups
    }, {} as Record<string, Transaction[]>)
  }, [filteredTransactions])

  const formatDate = (dateStr: string) => {
    if (!isMounted || !settings) return dateStr
    try {
      return new Date(dateStr).toLocaleDateString(settings.language === 'id' ? 'id-ID' : 'en-US', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    } catch (e) {
      return dateStr
    }
  }

  const formatCurrency = (amount: number) => {
    if (!isMounted || !settings) return `Rp ${amount.toLocaleString()}`
    return Math.abs(amount).toLocaleString(settings.language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: settings.currency,
      minimumFractionDigits: 0
    })
  }

  const getWalletName = (id: string) => {
    return wallets.find(w => w.id === id)?.name || "Unspecified Wallet"
  }

  if (!isMounted || !settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.history}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.manageActivity}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 glass-card border-none shadow-md">
            <Download className="h-5 w-5" />
          </Button>
          <Button asChild size="icon" className="rounded-2xl h-12 w-12 bg-primary shadow-lg">
            <Link href="/transactions/add">
              <Plus className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={settings.language === 'id' ? "Cari transaksi..." : "Search merchants..."} 
              className="pl-10 h-12 rounded-2xl glass-card border-none focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[120px] h-12 rounded-2xl glass-card border-none">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">{settings.language === 'id' ? 'Semua' : 'All'}</SelectItem>
              <SelectItem value="food">{settings.language === 'id' ? 'Makanan' : 'Food'}</SelectItem>
              <SelectItem value="groceries">{settings.language === 'id' ? 'Belanja' : 'Groceries'}</SelectItem>
              <SelectItem value="shopping">{settings.language === 'id' ? 'Pakaian' : 'Shopping'}</SelectItem>
              <SelectItem value="transport">{settings.language === 'id' ? 'Transport' : 'Transport'}</SelectItem>
              <SelectItem value="income">{settings.language === 'id' ? 'Pendapatan' : 'Income'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="space-y-8">
        {Object.entries(groupedTransactions).sort((a, b) => b[0].localeCompare(a[0])).map(([date, dayTransactions]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-2">
              <Calendar className="h-3 w-3" />
              {formatDate(date)}
            </h3>
            <div className="space-y-3">
              {dayTransactions.map((tx) => {
                const Icon = CATEGORY_ICONS[tx.category] || WalletIcon
                const colorClass = CATEGORY_COLORS[tx.category] || "bg-muted text-foreground"
                
                return (
                  <Card 
                    key={tx.id} 
                    className="group cursor-pointer rounded-[24px] glass-card border-none p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    onClick={() => router.push(`/transactions/edit/${tx.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", colorClass)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{tx.merchant}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{tx.category}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-[10px] text-muted-foreground">{getWalletName(tx.walletId)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn(
                            "font-bold font-headline text-sm",
                            tx.type === 'income' ? "text-accent-foreground" : "text-foreground"
                          )}>
                            {tx.type === 'income' ? "+" : "-"}{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t.completed}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">{settings.language === 'id' ? 'Tidak ada transaksi' : 'No transactions found'}</h3>
            <p className="text-sm text-muted-foreground">{settings.language === 'id' ? 'Sesuaikan filter atau pencarian Anda' : 'Try adjusting your filters or search term.'}</p>
            <Button variant="link" className="mt-2 text-primary" onClick={() => {setSearchTerm(""); setCategoryFilter("all")}}>
              {settings.language === 'id' ? 'Hapus semua filter' : 'Clear all filters'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
