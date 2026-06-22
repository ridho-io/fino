"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Save, CreditCard, Palette, Banknote } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { storage, UserSettings } from "@/lib/storage"
import { toast } from "@/hooks/use-toast"
import { WalletCard } from "@/components/wallet-card"

const COLORS = [
  { label: "Deep Forest", value: "#1A312C" },
  { label: "Ocean Blue", value: "#1E3A8A" },
  { label: "Wine Red", value: "#7F1D1D" },
  { label: "Royal Purple", value: "#581C87" },
  { label: "Slate Grey", value: "#1F2937" },
  { label: "Sage Green", value: "#428475" },
]

export default function AddWalletPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    cardNumber: "",
    color: COLORS[0].value
  })

  useEffect(() => {
    setSettings(storage.getSettings())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.balance) {
      toast({ title: "Required Fields", description: "Please fill in name and initial balance.", variant: "destructive" })
      return
    }

    storage.addWallet({
      name: formData.name,
      balance: parseFloat(formData.balance),
      cardNumber: formData.cardNumber || undefined,
      color: formData.color
    })

    toast({ title: "Success", description: "New wallet created!" })
    router.push("/wallets")
  }

  if (!settings) return null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">{settings.language === 'id' ? 'Dompet Baru' : 'New Wallet'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{settings.language === 'id' ? 'Tambah sumber dana baru' : 'Add a new source of funds'}</p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="px-1">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Preview</Label>
          <WalletCard 
            name={formData.name || (settings.language === 'id' ? "Nama Dompet" : "Wallet Name")} 
            balance={parseFloat(formData.balance) || 0} 
            cardNumber={formData.cardNumber || "•••• •••• •••• 1234"}
            color={formData.color}
            currency={settings.currency}
            locale={settings.language === 'id' ? 'id-ID' : 'en-US'}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass-card border-none rounded-[32px] overflow-hidden shadow-sm">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> {settings.language === 'id' ? 'Nama Dompet' : 'Wallet Name'}
                </Label>
                <Input 
                  placeholder={settings.language === 'id' ? "Mis: Rekening Utama" : "e.g. Personal Checking"} 
                  className="h-12 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" /> {settings.language === 'id' ? 'Saldo Awal' : 'Initial Balance'}
                </Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  className="h-12 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> {settings.language === 'id' ? '4 Digit Terakhir (Opsional)' : 'Last 4 Digits (Optional)'}
                </Label>
                <Input 
                  placeholder="4422" 
                  maxLength={4}
                  className="h-12 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({...formData, cardNumber: e.target.value.replace(/\D/g, '')})}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> {settings.language === 'id' ? 'Warna Kartu' : 'Card Color'}
                </Label>
                <div className="grid grid-cols-6 gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-10 w-full rounded-lg transition-all ${formData.color === color.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({...formData, color: color.value})}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-lg shadow-xl font-bold">
            <Save className="mr-2 h-5 w-5" /> {settings.language === 'id' ? 'Buat Dompet' : 'Create Wallet'}
          </Button>
        </form>
      </section>
    </div>
  )
}