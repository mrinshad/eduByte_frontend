"use client"

import * as React from "react"

import { getDefaultAcademicYear } from "@/lib/services/academicYear"

type Listener = () => void

let currentAcademicYear = "Academic Year"
let isFetching = false
let eventSource: EventSource | null = null
const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function closeEventSourceIfIdle() {
  if (eventSource && listeners.size === 0) {
    eventSource.close()
    eventSource = null
  }
}

async function loadCurrentAcademicYear() {
  if (isFetching) {
    return currentAcademicYear
  }

  isFetching = true

  try {
    const defaultAcademicYear = await getDefaultAcademicYear()
    const nextAcademicYear = defaultAcademicYear?.name?.trim() || "Academic Year"

    if (nextAcademicYear !== currentAcademicYear) {
      currentAcademicYear = nextAcademicYear
      emitChange()
    }

    return currentAcademicYear
  } finally {
    isFetching = false
  }
}

function startStreaming() {
  if (typeof window === "undefined" || eventSource) {
    return
  }

  void loadCurrentAcademicYear()

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  eventSource = new EventSource(`${apiBaseUrl}/api/academicyear/stream`)

  eventSource.addEventListener("academic-year-changed", () => {
    void loadCurrentAcademicYear()
  })

  eventSource.addEventListener("connected", () => {
    void loadCurrentAcademicYear()
  })

  eventSource.onerror = () => {
    // The browser will auto-reconnect; avoid fallback polling.
  }
}

function stopStreamingIfIdle() {
  closeEventSourceIfIdle()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  startStreaming()

  return () => {
    listeners.delete(listener)
    stopStreamingIfIdle()
  }
}

function getSnapshot() {
  return currentAcademicYear
}

function getServerSnapshot() {
  return "Academic Year"
}

export function useCurrentAcademicYear() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export async function refreshCurrentAcademicYear() {
  const previous = currentAcademicYear
  const next = await loadCurrentAcademicYear()

  if (next !== previous) {
    emitChange()
  }

  return next
}