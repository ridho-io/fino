"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  Bell, 
  Lock, 
  ShieldCheck, 
  Globe, 
  Moon, 
  LogOut, 
  ChevronRight, 
  Database,
  Trash2,
  ChevronLeft,
  Languages,
  Key
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { storage, UserSettings } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { translations } from "@/lib/translations"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [newPin, setNewPin] = useState('')

  useEffect(() => {
    setSettings(storage.getSettings())
  }, [])

  const handleToggle = (key: keyof UserSettings, value: boolean) => {
    if (!settings) return
    const updated = storage.updateSettings({ [key]: value })
    if (updated) setSettings(updated)
    
    toast({ 
      title: "Setting Updated", 
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} is now ${value ? 'on' : 'off'}.` 
    })
  }

  const handleLanguageChange = (lang: 'id' | 'en') => {
    if (!settings) return
    const updated = storage.updateSettings({ language: lang })
    if (updated) setSettings(updated)
    toast({ title: lang === 'id' ? "Bahasa diubah" : "Language changed" })
  }

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You have been safely logged out."
    })
  }

  const handleResetData = () => {
    const t = settings ? translations[settings.language] : translations.id
    if (confirm(t.clearData + "?")) {
      storage.resetAllData()
    }
  }

  const handleSavePin = () => {
    if (newPin.length < 4) return
    storage.updateSettings({ pin: newPin, isPinEnabled: true })
    setSettings(storage.getSettings())
    setIsPinDialogOpen(false)
    setNewPin('')
    toast({ title: settings?.language === 'id' ? "PIN Berhasil Diatur" : "PIN Set Successfully" })
  }

  const handleExportData = () => {
    const transactions = storage.getTransactions()
    if (transactions.length === 0) {
      toast({ title: "No data", description: "You don't have any transactions to export." })
      return
    }

    const headers = ["Date", "Merchant", "Amount", "Category", "Type", "Note"]
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [t.date, t.merchant, t.amount, t.category, t.type, t.note || ""].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `fino_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({ title: settings?.language === 'id' ? "Data Diekspor" : "Data Exported", description: "Your CSV file is ready." })
  }

  if (!settings) return null
  const t = translations[settings.language]

  const settingsGroups = [
    {
      title: t.preferences,
      items: [
        { icon: Bell, label: t.notifications, value: settings.notifications, onToggle: (v: boolean) => handleToggle('notifications', v), type: "switch" },
        { icon: Moon, label: t.darkMode, value: settings.darkMode, onToggle: (v: boolean) => handleToggle('darkMode', v), type: "switch" },
        { 
          icon: Languages, 
          label: t.language, 
          type: "select", 
          value: settings.language, 
          options: [
            { label: "Bahasa Indonesia", value: "id" },
            { label: "English", value: "en" }
          ],
          onChange: handleLanguageChange
        },
        { icon: Globe, label: t.currency, sublabel: "Rp (IDR)", type: "link" },
      ]
    },
    {
      title: t.security,
      items: [
        { icon: Lock, label: t.changePin, sublabel: settings.isPinEnabled ? t.pinEnabled : t.pinDisabled, type: "action", action: () => setIsPinDialogOpen(true) },
        { icon: ShieldCheck, label: t.biometric, value: settings.biometric, onToggle: (v: boolean) => handleToggle('biometric', v), type: "switch" },
      ]
    },
    {
      title: t.dataManagement,
      items: [
        { icon: Database, label: t.exportData, type: "action", action: handleExportData },
        { icon: Trash2, label: t.clearData, type: "action", action: handleResetData, destructive: true },
      ]
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.settings}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.personalize}</p>
        </div>
      </header>

      <section className="flex flex-col items-center py-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src="https://picsum.photos/seed/fino-user/150/150" />
            <AvatarFallback>{settings.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <Button size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary border-2 border-white shadow-lg">
            <User className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="mt-4 text-xl font-bold">{settings.userName}</h2>
        <p className="text-sm text-muted-foreground">{settings.userEmail}</p>
        <Badge variant="secondary" className="mt-2 bg-accent/20 text-primary border-none">Premium Member</Badge>
      </section>

      <div className="space-y-8">
        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">
              {group.title}
            </h3>
            <Card className="glass-card border-none rounded-[24px] overflow-hidden shadow-sm">
              <CardContent className="p-0 divide-y divide-muted/30">
                {group.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => item.type === 'action' && item.action?.()}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted/30 text-primary'}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${item.destructive ? 'text-destructive' : ''}`}>{item.label}</p>
                        {item.sublabel && <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>}
                      </div>
                    </div>
                    {item.type === "switch" ? (
                      <Switch 
                        checked={item.value as boolean} 
                        onCheckedChange={item.onToggle} 
                      />
                    ) : item.type === "select" ? (
                      <Select value={item.value as string} onValueChange={item.onChange as any}>
                        <SelectTrigger className="w-[150px] h-9 bg-muted/50 border-none rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {item.options?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        <Button 
          variant="ghost" 
          className="w-full h-14 rounded-2xl bg-muted/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold transition-all"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" /> {t.logout}
        </Button>
      </div>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-center">{t.setPin}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Key className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-center block text-xs uppercase tracking-widest text-muted-foreground">{t.enterPin} (4 digits)</Label>
              <Input 
                type="password" 
                maxLength={4} 
                className="h-14 text-center text-2xl font-bold tracking-widest rounded-xl bg-muted/30 border-none"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleSavePin} className="w-full rounded-xl h-12" disabled={newPin.length < 4}>{t.confirm}</Button>
              <Button 
                variant="ghost" 
                className="w-full rounded-xl h-12 text-destructive" 
                onClick={() => {
                  storage.updateSettings({ isPinEnabled: false, pin: undefined })
                  setSettings(storage.getSettings())
                  setIsPinDialogOpen(false)
                }}
              >
                {t.discard}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
