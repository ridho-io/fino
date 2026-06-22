"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Mic, MicOff, Bot, User, Wallet as WalletIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { financialAssistantChat } from "@/ai/flows/financial-assistant-chat"
import { parseNaturalLanguageTransaction } from "@/ai/flows/natural-language-transaction-entry"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { storage, Wallet, Transaction, UserSettings } from "@/lib/storage"
import { translations } from "@/lib/translations"
import { useRouter } from "next/navigation"

interface Message {
  role: "assistant" | "user"
  content: string
  type?: "transaction" | "chat"
  data?: any
}

export default function AssistantPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsLoadingRecording] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = storage.getSettings()
    setSettings(s)
    setWallets(storage.getWallets())
    setMessages([
      { 
        role: "assistant", 
        content: s.language === 'id' 
          ? "Halo! Saya Fino. Saya bisa membantu melacak pengeluaran atau menjawab pertanyaan seperti 'Berapa banyak yang saya habiskan untuk kopi minggu ini?'"
          : "Hello! I'm Fino. I can help you track spending or answer questions like 'How much did I spend on coffee this week?'" 
      }
    ])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const formatCurrency = (amount: number) => {
    return Math.abs(amount).toLocaleString('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    })
  }

  const handleConfirmTransaction = (data: any) => {
    if (wallets.length === 0) {
      toast({ title: settings?.language === 'id' ? "Tidak ada Dompet" : "No Wallet", description: settings?.language === 'id' ? "Harap tambahkan dompet terlebih dahulu." : "Please add a wallet first.", variant: "destructive" })
      return
    }

    storage.addTransaction({
      merchant: data.description,
      amount: data.transactionType === 'income' ? Math.abs(data.amount) : -Math.abs(data.amount),
      category: data.category,
      date: data.transactionDate || new Date().toISOString().split('T')[0],
      walletId: wallets[0].id,
      type: data.transactionType || 'expense'
    })

    toast({ title: settings?.language === 'id' ? "Sukses" : "Success", description: settings?.language === 'id' ? "Transaksi dicatat!" : "Transaction recorded!" })
    setMessages(prev => [...prev, { role: "assistant", content: settings?.language === 'id' ? "Bagus! Saya sudah menambahkannya ke riwayat Anda." : "Great! I've added that to your history." }])
  }

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || query.trim()
    if (!textToSend || isLoading) return

    if (!textOverride) setQuery("")
    setMessages(prev => [...prev, { role: "user", content: textToSend }])
    setIsLoading(true)

    try {
      const isRecordAttempt = (
        textToSend.toLowerCase().includes('spent') || 
        textToSend.toLowerCase().includes('paid') || 
        textToSend.toLowerCase().includes('bought') || 
        textToSend.toLowerCase().includes('received') ||
        textToSend.toLowerCase().includes('habis') ||
        textToSend.toLowerCase().includes('bayar') ||
        textToSend.toLowerCase().includes('beli') ||
        textToSend.toLowerCase().includes('terima') ||
        (/\d/.test(textToSend) && textToSend.length < 50 && !textToSend.includes('?'))
      )

      if (isRecordAttempt) {
        const result = await parseNaturalLanguageTransaction({ sentence: textToSend })
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: settings?.language === 'id' ? `Saya sudah menyiapkan entri transaksi baru. Apakah ini benar?` : `I've prepared a new transaction entry for you. Does this look right?`,
          type: "transaction",
          data: result
        }])
      } else {
        const history = storage.getTransactions().slice(0, 30)
        const historySummary = history.length > 0 
          ? history.map(t => `${t.date}: ${t.merchant} ${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)} (${t.category})`).join('\n')
          : settings?.language === 'id' ? "Belum ada riwayat transaksi." : "No transaction history recorded yet."

        const result = await financialAssistantChat({ 
          query: textToSend, 
          transactionHistory: historySummary 
        })
        setMessages(prev => [...prev, { role: "assistant", content: result.response }])
      }
    } catch (error) {
      toast({ title: "Error", description: "Fino had trouble processing that. Try again?", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Not Supported", description: "Speech recognition not supported.", variant: "destructive" })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.lang = settings?.language === 'id' ? 'id-ID' : 'en-US'

    recognition.onstart = () => setIsLoadingRecording(true)
    recognition.onend = () => setIsLoadingRecording(false)
    recognition.onerror = () => setIsLoadingRecording(false)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleSend(transcript)
    }

    recognition.start()
  }

  if (!settings) return null
  const t = translations[settings.language]

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Sparkles className="h-6 w-6 text-accent dark:text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">{t.assistantTitle}</h1>
          <p className="text-xs text-muted-foreground">{t.assistantStatus}</p>
        </div>
      </header>

      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col gap-2 max-w-[85%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{msg.role === "assistant" ? "Fino" : "You"}</span>
              </div>
              <div className={cn(
                "rounded-2xl p-4 text-sm leading-relaxed ios-shadow", 
                msg.role === "user" ? "bg-primary text-primary-foreground" : "glass-card"
              )}>
                {msg.content}
                {msg.type === "transaction" && msg.data && (
                  <div className="mt-4 p-3 rounded-xl bg-accent/20 border border-accent/30 text-foreground">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{msg.data.description}</h4>
                      <Badge variant="outline" className="bg-white/50 dark:bg-card/50 text-[10px]">{msg.data.category}</Badge>
                    </div>
                    <p className="text-xl font-headline font-bold">
                      {formatCurrency(msg.data.amount)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="h-8 flex-1 bg-primary text-primary-foreground text-xs rounded-lg" onClick={() => handleConfirmTransaction(msg.data)}>{t.confirm}</Button>
                      <Button size="sm" variant="ghost" className="h-8 flex-1 text-xs text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => {
                        setMessages(prev => [...prev, { role: "assistant", content: t.discard === 'Buang' ? 'Tidak masalah, saya hapus entri tersebut.' : "No problem, I've discarded that entry." }])
                      }}>{t.discard}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">{t.thinking}</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="relative mt-auto flex gap-2">
        <div className="relative flex-1">
          <Input 
            className="h-14 pl-4 pr-12 rounded-2xl glass-card ios-shadow border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
            placeholder={settings.language === 'id' ? "Tanya Fino atau katakan 'Habis 20rb kopi'..." : "Ask Fino or say 'Spent 20k on coffee'..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button 
            size="icon" 
            variant="ghost"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl transition-all",
              isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary"
            )}
            onClick={startVoiceInput}
            disabled={isLoading}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
        <Button size="icon" className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg" onClick={() => handleSend()} disabled={!query.trim() || isLoading}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}