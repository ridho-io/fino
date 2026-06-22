
"use client"

import { useState, useEffect, useRef } from "react"
import { ScanLine, Upload, Camera, Check, Loader2, RefreshCcw, Save, List, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { extractReceiptData, ReceiptDataExtractionOutput } from "@/ai/flows/receipt-data-extraction-flow"
import { toast } from "@/hooks/use-toast"
import { storage, Wallet, UserSettings } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { translations } from "@/lib/translations"

export default function ScanPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [data, setData] = useState<ReceiptDataExtractionOutput | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  
  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setWallets(storage.getWallets())
    setSettings(storage.getSettings())
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Camera error:", err)
      setCameraError("Could not access camera. Please check permissions.")
      setIsCameraOpen(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const photoData = canvas.toDataURL("image/jpeg")
        setPreview(photoData)
        stopCamera()
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selected)
      setData(null)
    }
  }

  const handleExtract = async () => {
    if (!preview) return
    setIsExtracting(true)
    try {
      const result = await extractReceiptData({ receiptImage: preview })
      setData(result)
      toast({
        title: settings?.language === 'id' ? "Ekstraksi Selesai" : "Extraction Complete",
        description: `Merchant: ${result.merchantName}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: settings?.language === 'id' ? "Gagal membaca struk. Coba foto yang lebih jelas." : "Could not read the receipt. Please try a clearer photo.",
        variant: "destructive"
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSave = () => {
    if (!data) return
    if (wallets.length === 0) {
      toast({ title: settings?.language === 'id' ? "Tidak Ada Dompet" : "No Wallet Found", description: "Please add a wallet first.", variant: "destructive" })
      return
    }

    storage.addTransaction({
      merchant: data.merchantName,
      amount: -Math.abs(data.totalAmount),
      category: "Shopping",
      date: data.transactionDate || new Date().toISOString().split('T')[0],
      walletId: wallets[0].id,
      type: 'expense'
    })

    toast({ title: "Success", description: "Receipt saved!" })
    router.push('/transactions')
  }

  const formatCurrency = (amount: number) => {
    if (!settings) return `Rp ${amount.toLocaleString()}`
    return Math.abs(amount).toLocaleString(settings.language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: settings.currency,
      minimumFractionDigits: 0
    })
  }

  if (!settings) return null
  const t = translations[settings.language]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header>
        <h1 className="text-3xl font-bold font-headline">{t.scanTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.scanDesc}</p>
      </header>

      <section>
        {isCameraOpen ? (
          <div className="relative overflow-hidden rounded-[32px] bg-black aspect-[3/4] flex flex-col items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-white/50 border-dashed rounded-xl" />
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 px-6">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white" 
                onClick={stopCamera}
              >
                <X className="h-6 w-6" />
              </Button>
              <button 
                className="h-20 w-20 rounded-full bg-white p-1 shadow-2xl active:scale-90 transition-transform"
                onClick={capturePhoto}
              >
                <div className="w-full h-full rounded-full border-4 border-primary/20 bg-white" />
              </button>
              <div className="w-14" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : !preview ? (
          <div className="space-y-4">
            <div className="group relative flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-16 text-center transition-all">
              <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl">
                <ScanLine className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{t.readyToScan}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[220px]">{t.alignReceipt}</p>
              
              <div className="mt-8 flex flex-col gap-3 w-full max-w-[240px]">
                <Button className="h-14 rounded-2xl bg-primary text-white shadow-lg gap-2" onClick={startCamera}>
                  <Camera className="h-5 w-5" /> {t.useCamera}
                </Button>
                
                <label className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-muted-foreground/20 h-14 font-semibold text-primary shadow-sm hover:bg-muted/10 transition-all">
                    <Upload className="h-5 w-5" /> {t.uploadImage}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              {cameraError && <p className="mt-4 text-xs text-destructive font-medium">{cameraError}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] glass-card ios-shadow max-h-[400px] flex items-center justify-center bg-black/5">
              <img src={preview} alt="Receipt preview" className="w-full h-full object-contain" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full bg-white/80 hover:bg-white text-destructive shadow-lg backdrop-blur-md" 
                onClick={() => { setPreview(null); setData(null); }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>

            {!data ? (
              <Button className="w-full h-16 rounded-[24px] bg-primary text-lg shadow-xl" onClick={handleExtract} disabled={isExtracting}>
                {isExtracting ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {t.processing}</>
                ) : (
                  <><Sparkles className="mr-2 h-6 w-6 text-accent" /> {t.extractData}</>
                )}
              </Button>
            ) : (
              <Card className="glass-card border-none rounded-[32px] overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t.merchant}</h4>
                      <p className="text-2xl font-bold">{data.merchantName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{data.transactionDate}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t.total}</h4>
                      <p className="text-3xl font-bold font-headline text-primary">
                        {formatCurrency(data.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {data.items && data.items.length > 0 && (
                    <div className="space-y-3 mb-8">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <List className="h-3 w-3" /> {t.extractedItems}
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-muted-foreground">
                              <span className="font-bold text-primary mr-2">{item.quantity}x</span> {item.name}
                            </span>
                            <span className="font-medium">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4 opacity-50" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button className="h-14 rounded-2xl bg-primary flex-1 font-bold shadow-lg" onClick={handleSave}>
                      <Save className="mr-2 h-5 w-5" /> {t.saveEntry}
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl flex-1 font-bold border-2" onClick={() => setData(null)}>
                      {t.discard}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
