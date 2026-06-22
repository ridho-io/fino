"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { storage, Transaction, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { Calendar, TrendingDown, TrendingUp, PieChart as PieIcon, Activity } from "lucide-react"

const COLORS = ["#1A312C", "#428475", "#99F6E4", "#FDE68A", "#F87171", "#818CF8", "#F472B6"]

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setTransactions(storage.getTransactions())
    setSettings(storage.getSettings())
  }, [])

  const formatCurrency = (amount: number) => {
    if (!isMounted || !settings) return `Rp ${amount.toLocaleString()}`
    return Math.abs(amount).toLocaleString('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    })
  }

  // Data for Category Pie Chart
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Data for Spending Trend (Last 7 Days)
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()

    return last7Days.map(date => {
      const dailyTotal = transactions
        .filter(t => t.date === date && t.type === 'expense')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0)
      
      const label = new Date(date).toLocaleDateString(settings?.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' })
      return { date: label, amount: dailyTotal }
    })
  }, [transactions, settings])

  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const total = expenses.reduce((acc, t) => acc + Math.abs(t.amount), 0)
    const avg = total / (transactions.length > 0 ? 30 : 1) // Rough 30 day avg
    const maxCategory = categoryData[0]?.name || "-"

    return { total, avg, maxCategory }
  }, [transactions, categoryData])

  if (!isMounted || !settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header>
        <h1 className="text-3xl font-bold font-headline">{t.analytics}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.insightDesc}</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card ios-shadow border-none p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Activity className="h-4 w-4" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.averageDaily}</p>
          <p className="text-lg font-bold font-headline mt-1">{formatCurrency(stats.avg)}</p>
        </Card>
        <Card className="glass-card ios-shadow border-none p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-primary mb-3">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.mostSpentIn}</p>
          <p className="text-lg font-bold font-headline mt-1">{stats.maxCategory}</p>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.spendingTrend}</h3>
        </div>
        <Card className="glass-card border-none rounded-[32px] p-6 shadow-sm overflow-hidden">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl bg-primary p-2 text-[10px] text-primary-foreground shadow-xl border-none">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.categoryBreakdown}</h3>
        </div>
        <Card className="glass-card border-none rounded-[32px] p-8 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-white dark:bg-card p-3 shadow-2xl border border-muted/20">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">{payload[0].name}</p>
                            <p className="text-sm font-bold">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{t.total}</span>
                <span className="text-lg font-bold font-headline">{formatCurrency(stats.total).split(',')[0]}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full">
              {categoryData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold truncate">{entry.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {((entry.value / stats.total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}