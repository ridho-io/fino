"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ListOrdered, ScanLine, PieChart, Sparkles, Plus, Mic, FileText, Loader2, X, BarChart3, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { parseNaturalLanguageTransaction } from "@/ai/flows/natural-language-transaction-entry"
import { toast } from "@/hooks/use-toast"
import { storage, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setSettings(storage.getSettings())
  }, [])

  const t = settings ? translations[settings.language] : translations.id

  const navItems = [
    { icon: Home, label: settings?.language === 'id' ? "Beranda" : "Home", href: "/" },
    { icon: ListOrdered, label: t.history, href: "/transactions" },
    { icon: Plus, label: "Add", href: "#", primary: true },
    { icon: Target, label: t.budgets, href: "/budgets" },
    { icon: BarChart3, label: t.analytics, href: "/analytics" },
  ]

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Not Supported", description: "Voice recognition not supported.", variant: "destructive" })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = settings?.language === 'id' ? 'id-ID' : 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setTranscript("")
    }

    recognition.onresult = (event: any) => {
      const current = event.results[0][0].transcript
      setTranscript(current)
    }

    recognition.onend = async () => {
      setIsRecording(false)
      if (!transcript) {
        toast({ title: settings?.language === 'id' ? "Suara tidak terdeteksi" : "No speech detected" })
        return
      }
      
      setIsProcessing(true)
      setIsOpen(false)

      try {
        const result = await parseNaturalLanguageTransaction({ sentence: transcript })
        const wallets = storage.getWallets()
        
        if (wallets.length === 0) {
          toast({ title: t.wallet, description: "Add a wallet first.", variant: "destructive" })
          return
        }

        storage.addTransaction({
          merchant: result.description,
          amount: result.transactionType === 'income' ? Math.abs(result.amount) : -Math.abs(result.amount),
          category: result.category,
          date: result.transactionDate || new Date().toISOString().split('T')[0],
          walletId: wallets[0].id,
          type: result.transactionType || 'expense'
        })

        toast({ 
          title: settings?.language === 'id' ? "Ditambahkan via Suara" : "Added via Voice", 
          description: `Saved: ${result.description}` 
        })
        router.push('/transactions')
      } catch (error) {
        toast({ title: "Parsing Error", description: "Fino couldn't understand that.", variant: "destructive" })
      } finally {
        setIsProcessing(false)
        setTranscript("")
      }
    }

    recognition.onerror = () => {
      setIsRecording(false)
      toast({ title: "Error", description: "Voice input failed.", variant: "destructive" })
    }

    recognition.start()
  }

  return (
    <>
      {isRecording && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary/95 text-white animate-in fade-in duration-300">
          <div className="relative mb-12 flex h-32 w-32 items-center justify-center rounded-full bg-white/10">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <Mic className="h-12 w-12 text-accent" />
          </div>
          <h2 className="text-2xl font-bold font-headline mb-4">{t.listening}</h2>
          <p className="px-8 text-center text-lg opacity-80 italic">
            {transcript || t.saySomething}
          </p>
          <Button variant="outline" className="mt-12 border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 px-8" onClick={() => setIsRecording(false)}>
            <X className="mr-2 h-4 w-4" /> Discard
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[32px] shadow-2xl">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-bold text-sm">{t.processing}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 md:pb-8">
        <nav className="mx-auto flex h-16 max-w-lg items-center justify-around rounded-[32px] glass-morphism px-6 shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            if (item.primary) {
              return (
                <Sheet key={item.label} open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <button 
                      className="group relative -mt-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50" 
                      disabled={isProcessing}
                    >
                      <Plus className="h-7 w-7" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-[40px] pb-10 px-8 border-none ios-shadow bg-background">
                    <SheetHeader className="mb-8 pt-2">
                      <SheetTitle className="text-center font-headline text-2xl font-bold">{t.quickEntry}</SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-3 gap-6">
                      <button 
                        onClick={handleVoiceInput}
                        className="flex flex-col items-center gap-4 transition-all active:scale-95 group"
                      >
                        <div className="h-16 w-16 rounded-[24px] bg-accent/20 flex items-center justify-center shadow-sm group-hover:bg-accent/30 transition-colors">
                          <Mic className="h-7 w-7 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.voice}</span>
                      </button>

                      <Link 
                        href="/transactions/add" 
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center gap-4 transition-all active:scale-95 group"
                      >
                        <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center shadow-sm group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.manual}</span>
                      </Link>

                      <Link 
                        href="/scan" 
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center gap-4 transition-all active:scale-95 group"
                      >
                        <div className="h-16 w-16 rounded-[24px] bg-secondary/20 flex items-center justify-center shadow-sm group-hover:bg-secondary/30 transition-colors">
                          <ScanLine className="h-7 w-7 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.scan}</span>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-1 flex-col items-center justify-center transition-all duration-300"
              >
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                  )}
                />
                <span
                  className={cn(
                    "mt-1 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
