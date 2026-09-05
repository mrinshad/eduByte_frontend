"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      <NumberInputScrollBlocker />
      {children}
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

function NumberInputScrollBlocker() {
  React.useEffect(() => {
    function onWheel(event: WheelEvent) {
      // 1. If currently focused activeElement is a number input, blur it so wheel scroll never alters value
      const active = document.activeElement
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur()
      }

      // 2. If the hovered target is a number input, blur it as well
      const target = event.target
      if (target instanceof HTMLInputElement && target.type === "number") {
        target.blur()
      }
    }

    window.addEventListener("wheel", onWheel, { passive: true })

    return () => {
      window.removeEventListener("wheel", onWheel)
    }
  }, [])

  return null
}

export { ThemeProvider }
