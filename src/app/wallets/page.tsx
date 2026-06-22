"use client"

import { useState, useEffect } from "react"
import { WalletCard } from "@/components/wallet-card"
import { Plus, Edit2, Trash2, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { storage, Wallet } from "@/lib/storage"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function WalletsPage() {
  const router = useRouter()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setWallets(storage.getWallets())
  }, [])

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? All associated transactions will be lost.`)) {
      storage.deleteWallet(id)
      setWallets(storage.getWallets())
      toast({ title: "Wallet Deleted", description: "The wallet and its transactions have been removed." })
    }
  }

  if (!isMounted) return null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">My Wallets</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your funding sources</p>
          </div>
        </div>
        <Button asChild className="rounded-2xl h-12 px-6 bg-primary shadow-lg">
          <Link href="/wallets/add">
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Link>
        </Button>
      </header>

      <div className="grid gap-6">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="group relative">
            <WalletCard {...wallet} className="cursor-default hover:scale-100" />
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-xl glass-card border-none text-xs font-bold"
                asChild
              >
                <Link href={`/wallets/edit/${wallet.id}`}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Wallet
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-xl glass-card border-none text-xs font-bold text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(wallet.id, wallet.name)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </Button>
            </div>
          </div>
        ))}

        {wallets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-[32px] border-2 border-dashed border-muted-foreground/20">
            <p className="text-muted-foreground">You don't have any wallets yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/wallets/add">Create your first wallet</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
