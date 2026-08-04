'use client'

import { useCallback, useEffect, useState } from 'react'
import { CONTACT } from './contact'

/**
 * The enquiry list — the pieces a buyer has picked out, ready to send to sales.
 *
 * A SKU, not a design, is what gets added: metal colour is part of the SKU, so
 * "the white one" and "the yellow one" are different things to quote for. The
 * list lives in localStorage because the site is static and there is nothing to
 * log in to; it survives a refresh and a closed tab, which is what matters when
 * someone is browsing 199 designs on a phone.
 */

export type EnquiryItem = {
  sku: string
  slug: string
  title: string
  category: string
  metalColour: string
  metal: string
  price: number | null
  carat: number | null
  size: string
  thumbnail: string | null
}

const KEY = 'seyaa.enquiry.v1'
const CHANGED = 'seyaa:enquiry-changed'

function read(): EnquiryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or unavailable storage should never take the page down.
    return []
  }
}

function write(items: EnquiryItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Private browsing can refuse writes; the in-memory list still works.
  }
  window.dispatchEvent(new Event(CHANGED))
}

export function useEnquiry() {
  const [items, setItems] = useState<EnquiryItem[]>([])
  // Storage is not available while the server renders, so the first paint has
  // to match the server's empty list; `ready` gates anything count-dependent.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setItems(read())
    sync()
    setReady(true)
    window.addEventListener(CHANGED, sync)
    window.addEventListener('storage', sync) // another tab
    return () => {
      window.removeEventListener(CHANGED, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const add = useCallback((item: EnquiryItem) => {
    write([...read().filter((i) => i.sku !== item.sku), item])
  }, [])

  const remove = useCallback((sku: string) => {
    write(read().filter((i) => i.sku !== sku))
  }, [])

  const toggle = useCallback((item: EnquiryItem) => {
    const current = read()
    write(
      current.some((i) => i.sku === item.sku)
        ? current.filter((i) => i.sku !== item.sku)
        : [...current, item],
    )
  }, [])

  const clear = useCallback(() => write([]), [])

  return {
    items,
    ready,
    count: items.length,
    has: (sku: string) => items.some((i) => i.sku === sku),
    add,
    remove,
    toggle,
    clear,
  }
}

/**
 * The message the buyer sends. Plain text on purpose — it has to survive
 * WhatsApp, an email client and a paste into anything else unchanged.
 *
 * It carries no prices. Not because there are none to carry, but because this
 * message is composed in the customer's own WhatsApp: anything written into it
 * is shown to them. Asking for the quote is the point of sending it.
 */
export function buildEnquiryMessage(items: EnquiryItem[], from?: { name?: string; note?: string }) {
  const lines: string[] = [`Hello ${CONTACT.businessName}, I would like to enquire about:`, '']

  items.forEach((item, i) => {
    const bits = [
      `${item.title} (${item.metalColour} gold)`,
      item.carat ? `${item.carat} ct` : '',
      item.size,
    ].filter(Boolean)
    lines.push(`${i + 1}. ${item.sku} — ${bits.join(' · ')}`)
  })

  lines.push(
    '',
    `Please send pricing and availability for ${
      items.length === 1 ? 'this piece' : `these ${items.length} pieces`
    }.`,
  )

  if (from?.name?.trim()) lines.push('', `From: ${from.name.trim()}`)
  if (from?.note?.trim()) lines.push(`Note: ${from.note.trim()}`)

  return lines.join('\n')
}
