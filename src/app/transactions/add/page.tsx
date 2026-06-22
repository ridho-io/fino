
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Save, ShoppingCart, Calendar, Banknote, Wallet as WalletIcon, FileText, Mic, MicOff } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { storage, Wallet, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AddTransactionPage() {
  const router = useRouter()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    category: "General",
    date: new Date().toISOString().split('T')[0],
    walletId: "",
    type: "expense" as "expense" | "income",
    note: ""
  })

  useEffect(() => {
    const s = storage.getSettings()
    setSettings(s)
    const w = storage.getWallets()
    setWallets(w)
    if (w.length > 0) {
      setFormData(prev => ({ ...prev, walletId: w[0].id }))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.merchant || !formData.amount || !formData.walletId) {
      toast({ title: settings?.language === 'id' ? "Lengkapi Data" : "Required Fields", description: "Please fill in all mandatory fields.", variant: "destructive" })
      return
    }

    const amountNum = parseFloat(formData.amount)
    storage.addTransaction({
      merchant: formData.merchant,
      amount: formData.type === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum),
      category: formData.category,
      date: formData.date,
      walletId: formData.walletId,
      type: formData.type,
      note: formData.note
    })

    toast({ title: "Success", description: "Transaction recorded!" })
    router.push("/transactions")
  }

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Not Supported", description: "Speech recognition is not supported.", variant: "destructive" })
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.lang = settings?.language === 'id' ? 'id-ID' : 'en-US'

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setFormData(prev => ({ ...prev, note: prev.note ? prev.note + " " + transcript : transcript }))
    }

    recognition.start()
  }

  if (!settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.addEntry}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.manualEntry}</p>
        </div>
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
                  placeholder="0" 
                  className="h-16 pl-14 text-3xl font-bold font-headline rounded-2xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.merchant}</Label>
              <div className="relative">
                <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder={settings.language === 'id' ? "Mis: Starbucks, Gaji" : "e.g. Starbucks, Salary"} 
                  className="h-14 pl-12 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.date}</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="date"
                    className="h-14 pl-12 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.category}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-14 rounded-xl bg-background border-none">
                    <SelectValue placeholder="Category" />
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
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    <SelectValue placeholder="Select Wallet" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {wallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.notes}</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-8 gap-2 rounded-lg", isRecording && "text-destructive animate-pulse")}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? "Stop" : t.voiceNote}
                </Button>
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <textarea 
                  placeholder={settings.language === 'id' ? "Detail lainnya..." : "Any details..."}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-background border-none focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 rounded-[24px] bg-primary text-lg shadow-xl font-bold transition-all active:scale-[0.98]">
          <Save className="mr-2 h-6 w-6" /> {t.save}
        </Button>
      </form>
    </div>
  )
}
