"use client"

import * as React from "react"

function Avatar({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted-foreground text-sm font-medium text-muted-foreground ${className || ""}`}
    >
      {children}
    </div>
  )
}

function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null

  return <img src={src} alt={alt || "avatar"} className="h-full w-full object-cover" />
}

function AvatarFallback({ children }: { children?: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center bg-transparent text-sm">{children}</div>
}

export { Avatar, AvatarImage, AvatarFallback }
