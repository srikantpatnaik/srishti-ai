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
    <div className="w-full sm:w-[20%] border-r bg-card flex flex-col transition-all duration-300 overflow-y-auto"
         style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              className="p-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setShowSettings(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm mb-2 block">Model</label>
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            disabled={loadingProviders}
          >
            <SelectTrigger className="h-9">
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
        <h3 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Toggle Settings</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Toggle Preview</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+X</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Toggle App Drawer</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+M</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Close App Drawer</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
