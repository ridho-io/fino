"use client"

import { useState, useEffect, useMemo } from "react"
import { WalletCard, AddWalletCard } from "@/components/wallet-card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, MessageSquare, Sparkles, Wallet as WalletIcon, UserCircle, ShieldCheck, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { storage, Wallet, Transaction, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setWallets(storage.getWallets())
    setTransactions(storage.getTransactions().slice(0, 5))
    setSettings(storage.getSettings())
  }, [])

  const totals = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += Math.abs(tx.amount)
      else acc.expenses += Math.abs(tx.amount)
      return acc
    }, { income: 0, expenses: 0 })
  }, [transactions])

  const healthScore = useMemo(() => storage.getFinancialHealth(), [transactions])

  const formatCurrency = (amount: number) => {
    if (!isMounted || !settings) return `Rp ${amount.toLocaleString()}`
    return Math.abs(amount).toLocaleString('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    })
  }

  if (!isMounted || !settings) return null;
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">{t.welcome}</h2>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t.status}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/assistant" className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95">
            <Sparkles className="h-6 w-6 text-accent dark:text-primary" />
          </Link>
          <Link href="/settings" className="transition-transform active:scale-95 text-primary hover:text-primary/80">
            <UserCircle className="h-9 w-9" />
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.wallets}</h3>
          <Link href="/wallets" className="text-xs font-medium text-primary hover:underline">{t.manage}</Link>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {wallets.map((wallet) => (
              <CarouselItem key={wallet.id} className="basis-[85%] pl-4">
                <WalletCard {...wallet} currency={settings.currency} locale={settings.language === 'id' ? 'id-ID' : 'en-US'} />
              </CarouselItem>
            ))}
            <CarouselItem className="basis-[85%] pl-4">
              <Link href="/wallets/add">
                <AddWalletCard />
              </Link>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card ios-shadow border-none rounded-[24px] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-primary">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.income}</p>
              <p className="text-lg font-bold">+{formatCurrency(totals.income)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card ios-shadow border-none rounded-[24px] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.expenses}</p>
              <p className="text-lg font-bold">-{formatCurrency(totals.expenses)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-[32px] bg-primary p-6 text-primary-foreground shadow-2xl transition-colors duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/20 backdrop-blur-md">
                <Sparkles className="h-5 w-5 text-accent dark:text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">{t.insightTitle}</h3>
                <p className="text-[10px] opacity-70 uppercase tracking-widest">{t.insightDesc}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              {transactions.length > 0 
                ? `${settings.language === 'id' ? 'Anda telah menghabiskan' : "You've spent"} ${formatCurrency(totals.expenses)} ${settings.language === 'id' ? 'bulan ini.' : 'this month.'}`
                : settings.language === 'id' ? "Mulai tambahkan transaksi!" : "Start adding transactions!"}
            </p>
            <Button variant="outline" className="mt-4 h-9 w-full border-primary-foreground/20 bg-primary-foreground/10 text-xs hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-xl" asChild>
              <Link href="/assistant">
                <MessageSquare className="mr-2 h-4 w-4" /> {t.askFino}
              </Link>
            </Button>
          </div>
        </section>

        <section className="glass-card ios-shadow border-none rounded-[32px] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.healthScore}</h3>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              healthScore > 80 ? "bg-accent/20 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              {healthScore > 80 ? 'Good' : 'Needs Work'}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-4xl font-bold font-headline text-primary">{healthScore}%</div>
            <div className="text-[10px] text-muted-foreground max-w-[100px] text-right">{t.healthDesc}</div>
          </div>
          <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${healthScore}%` }} 
            />
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t.recentTransactions}</h3>
          <Link href="/transactions" className="text-xs text-primary">{t.viewAll}</Link>
        </div>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-2xl glass-card border-none p-4 shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => window.location.href = `/transactions/edit/${tx.id}`}>
              <div className="flex items-center gap-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-muted")}>
                  <WalletIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{tx.merchant}</h4>
                  <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                </div>
              </div>
              <span className={cn(
                "font-bold font-headline text-sm",
                tx.type === 'expense' ? "text-foreground" : "text-primary font-bold"
              )}>
                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">{settings.language === 'id' ? 'Belum ada transaksi.' : 'No transactions yet.'}</p>
          )}
        </div>
      </section>
    </div>
  )
}
