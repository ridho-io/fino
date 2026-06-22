
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Save, ShoppingCart, Calendar, Banknote, Wallet as WalletIcon, FileText, Trash2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { storage, Wallet, Transaction, UserSettings } from "@/lib/storage"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { translations } from "@/lib/translations"

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    category: "General",
    date: "",
    walletId: "",
    type: "expense" as "expense" | "income",
    note: ""
  })

  useEffect(() => {
    const s = storage.getSettings()
    setSettings(s)
    const tx = storage.getTransaction(id)
    if (!tx) {
      router.push("/transactions")
      return
    }
    setFormData({
      merchant: tx.merchant,
      amount: Math.abs(tx.amount).toString(),
      category: tx.category,
      date: tx.date,
      walletId: tx.walletId,
      type: tx.type,
      note: tx.note || ""
    })
    setWallets(storage.getWallets())
  }, [id, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(formData.amount)
    storage.updateTransaction(id, {
      merchant: formData.merchant,
      amount: formData.type === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum),
      category: formData.category,
      date: formData.date,
      walletId: formData.walletId,
      type: formData.type,
      note: formData.note
    })

    toast({ title: settings?.language === 'id' ? "Diperbarui" : "Updated", description: settings?.language === 'id' ? "Transaksi telah diupdate." : "Transaction details updated." })
    router.push("/transactions")
  }

  const handleDelete = () => {
    if (confirm(settings?.language === 'id' ? "Hapus transaksi ini? Saldo dompet akan disesuaikan kembali." : "Delete this transaction? This will also revert the wallet balance.")) {
      storage.deleteTransaction(id)
      toast({ title: settings?.language === 'id' ? "Dihapus" : "Deleted" })
      router.push("/transactions")
    }
  }

  if (!settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold font-headline">{settings.language === 'id' ? 'Edit Entri' : 'Edit Entry'}</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
          <Trash2 className="h-6 w-6" />
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex p-1 bg-muted/30 rounded-2xl">
          <button 
            type="button"
            className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", formData.type === 'expense' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => setFormData({ ...formData, type: 'expense' })}
          >
            {t.expenses}
          </button>
          <button 
            type="button"
            className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", formData.type === 'income' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => setFormData({ ...formData, type: 'income' })}
          >
            {t.income}
          </button>
        </div>

        <Card className="glass-card border-none rounded-[32px] overflow-hidden shadow-sm">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.amount}</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">
                  {settings.currency === 'IDR' ? 'Rp' : '$'}
                </span>
                <Input 
                  type="number" 
                  step="1"
                  className="h-16 pl-14 text-3xl font-bold font-headline rounded-2xl bg-background border-none focus-visible:ring-1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.merchant}</Label>
              <Input 
                className="h-14 rounded-xl bg-background border-none"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.date}</Label>
                <Input 
                  type="date"
                  className="h-14 rounded-xl bg-background border-none"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.category}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-14 rounded-xl bg-background border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Food">{settings.language === 'id' ? 'Makanan' : 'Food'}</SelectItem>
                    <SelectItem value="Groceries">{settings.language === 'id' ? 'Belanja' : 'Groceries'}</SelectItem>
                    <SelectItem value="Transport">{settings.language === 'id' ? 'Transportasi' : 'Transport'}</SelectItem>
                    <SelectItem value="Shopping">{settings.language === 'id' ? 'Pakaian' : 'Shopping'}</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Bills">Bills</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.wallet}</Label>
              <Select value={formData.walletId} onValueChange={(v) => setFormData({ ...formData, walletId: v })}>
                <SelectTrigger className="h-14 rounded-xl bg-background border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {wallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.notes}</Label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border-none outline-none text-sm"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 rounded-[24px] bg-primary text-lg font-bold">
          <Save className="mr-2 h-6 w-6" /> {settings.language === 'id' ? 'Simpan Perubahan' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
