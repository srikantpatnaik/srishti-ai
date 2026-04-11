import React from "react"
import { Bot, Moon, Sun, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Provider } from "@/types"

interface SettingsPanelProps {
  showSettings: boolean
  setShowSettings: (val: boolean) => void
  darkMode: boolean
  setDarkMode: (val: boolean) => void
  providers: Provider[]
  selectedProvider: string
  setSelectedProvider: (val: string) => void
  loadingProviders: boolean
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  darkMode,
  setDarkMode,
  providers,
  selectedProvider,
  setSelectedProvider,
  loadingProviders
}: SettingsPanelProps) {
  if (!showSettings) return null

  return (
    <div className="h-full border-r bg-[#121215] flex flex-col transition-all duration-300 overflow-y-auto"
         style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-[#e5e5e5] text-base font-medium">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg transition-colors bg-[#2e2e32] text-[#888888] hover:bg-[#2e2e32]/80"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              className="p-2 rounded-lg transition-colors bg-[#2e2e32] text-[#888888] hover:bg-[#2e2e32]/80"
              onClick={() => setShowSettings(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-[#888888] mb-2 block">Model</label>
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            disabled={loadingProviders}
          >
            <SelectTrigger className="h-10 bg-[#1f1f23] border-[#2e2e32] text-[#e5e5e5]">
              <Bot className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.name} value={provider.name}>
                  {provider.name} ({provider.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 border-t mt-auto sm:block hidden">
        <h3 className="text-[#888888] text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[#888888]">Toggle Settings</span>
            <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+B</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888888]">Toggle Preview</span>
            <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+X</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888888]">Toggle App Drawer</span>
            <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+M</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#888888]">Close App Drawer</span>
            <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}