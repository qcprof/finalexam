"use client"

import { Home, User, Settings, LogOut, FileText, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NavigationMenu() {
  return (
    <nav className="w-full border-b border-[--color-border] bg-[--color-card]/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-[--color-fg]">Final Exam</h1>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-[--color-fg]">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-[--color-fg]">
              <FileText className="mr-2 h-4 w-4" />
              Exam 1
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[--color-danger]">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </nav>
  )
}

