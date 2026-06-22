"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Target, TrendingUp, ChevronRight, PieChart as PieIcon, Flame, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { storage, Budget, Transaction, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [newBudget, setNewBudget] = useState({ category: "", limit: "", icon: "📦" })
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setBudgets(storage.getBudgets())
    setTransactions(storage.getTransactions())
    setSettings(storage.getSettings())
  }, [])

  const formatCurrency = (amount: number) => {
    if (!isMounted || !settings) return `Rp ${amount.toLocaleString()}`
    return amount.toLocaleString('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    })
  }

  const calculateSpent = (category: string) => {
    return transactions
      .filter(t => t.category.toLowerCase().includes(category.toLowerCase()) && t.type === 'expense')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0)
  }

  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0)
  const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0)
  const overallPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) return
    
    storage.addBudget({
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      icon: newBudget.icon,
      color: "bg-muted text-foreground"
    })
    
    setBudgets(storage.getBudgets())
    setIsAddOpen(false)
    setNewBudget({ category: "", limit: "", icon: "📦" })
    toast({ title: settings?.language === 'id' ? "Anggaran Dibuat" : "Budget Created" })
  }

  const handleDeleteBudget = (id: string) => {
    if (confirm(settings?.language === 'id' ? "Hapus batas anggaran ini?" : "Remove this budget limit?")) {
      storage.deleteBudget(id)
      setBudgets(storage.getBudgets())
      toast({ title: settings?.language === 'id' ? "Anggaran Dihapus" : "Budget Removed" })
    }
  }

  if (!isMounted || !settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.budgets}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.thisMonth}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-2xl h-12 w-12 bg-primary shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>{settings.language === 'id' ? 'Atur Anggaran Baru' : 'Set New Budget'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{settings.language === 'id' ? 'Nama Kategori' : 'Category Name'}</Label>
                <Input placeholder="e.g. Entertainment" value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{settings.language === 'id' ? 'Batas Bulanan' : 'Monthly Limit'}</Label>
                <Input type="number" placeholder="500000" value={newBudget.limit} onChange={e => setNewBudget({...newBudget, limit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{settings.language === 'id' ? 'Ikon Emoji' : 'Emoji Icon'}</Label>
                <Input placeholder="📦" value={newBudget.icon} onChange={e => setNewBudget({...newBudget, icon: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddBudget} className="w-full rounded-xl">
                {settings.language === 'id' ? 'Buat Anggaran' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <Card className="rounded-[32px] bg-primary text-primary-foreground p-8 border-none shadow-2xl overflow-hidden relative transition-colors duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PieIcon className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium opacity-70 uppercase tracking-widest">{t.totalSpend}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold font-headline">{formatCurrency(totalSpent)}</span>
              {totalLimit > 0 && <span className="text-lg opacity-60">/ {formatCurrency(totalLimit)}</span>}
            </div>
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="opacity-70">{overallPercent.toFixed(0)}% {settings.language === 'id' ? 'anggaran digunakan' : 'of budget used'}</span>
              </div>
              <Progress value={overallPercent} className="h-3 bg-primary-foreground/20" />
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-lg">{t.categories}</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = calculateSpent(budget.category)
            const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0
            const isOver = spent > budget.limit
            return (
              <div key={budget.id} className="group rounded-[24px] glass-card border-none p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-2xl bg-muted/50")}>
                      {budget.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{budget.category}</h4>
                      {isOver && (
                        <span className="flex items-center gap-1 text-[10px] text-destructive font-bold uppercase">
                          <AlertTriangle className="h-3 w-3" /> {settings.language === 'id' ? 'Melebihi anggaran' : 'Over budget'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(spent)} <span className="text-xs font-normal text-muted-foreground">/ {formatCurrency(budget.limit)}</span></p>
                      <p className={cn("text-[10px] font-bold", isOver ? 'text-destructive' : 'text-primary')}>
                        {percent.toFixed(0)}% {settings.language === 'id' ? 'terpakai' : 'used'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDeleteBudget(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={percent} className={cn("h-2", isOver ? 'bg-destructive/10' : '')} />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}