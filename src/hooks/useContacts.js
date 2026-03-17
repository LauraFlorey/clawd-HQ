import { useState, useCallback, useMemo } from 'react'
// Mock data disabled - using real data only
// import { mockContacts } from '../data/mockData'

const LS_KEY = 'clawd-crm-contacts'

const PREFERRED_TITLES = [
  'ceo', 'founder', 'vp', 'vice president', 'director', 'head of',
  'engineer', 'partner', 'cto', 'cfo', 'coo', 'cmo', 'president',
]

function loadUserContacts() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUserContacts(contacts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(contacts)) } catch {}
}

export function calculateScore(contact) {
  let score = 50

  if (contact.role) {
    score += 10
    const lower = contact.role.toLowerCase()
    if (PREFERRED_TITLES.some((t) => lower.includes(t))) score += 15
  }

  if (contact.company) score += 5

  if (contact.lastContact) {
    const daysSince = Math.floor((Date.now() - new Date(contact.lastContact).getTime()) / 86400000)
    if (daysSince <= 7) score += 10
    else if (daysSince <= 30) score += 5
  }

  if (contact.source === 'both') score += 25

  const interactionBonus = Math.min((contact.interactions || []).length * 5, 20)
  score += interactionBonus

  return Math.min(score, 100)
}

export function useContacts() {
  const [userContacts, setUserContacts] = useState(loadUserContacts)

  const allContacts = useMemo(
    () => [...userContacts]
      .filter((c) => c.status === 'active')
      .sort((a, b) => b.score - a.score),
    [userContacts]
  )

  const allTags = useMemo(() => {
    const set = new Set()
    for (const c of allContacts) {
      for (const t of c.tags || []) set.add(t)
    }
    return [...set].sort()
  }, [allContacts])

  const allCompanies = useMemo(() => {
    const set = new Set()
    for (const c of allContacts) {
      if (c.company) set.add(c.company)
    }
    return [...set].sort()
  }, [allContacts])

  const addContact = useCallback(({ name, email, company, role, phone, tags, notes }) => {
    const contact = {
      id: `crm-user-${Date.now()}`,
      name,
      email,
      company: company || null,
      role: role || null,
      phone: phone || null,
      score: 0,
      tags: tags || [],
      source: 'manual',
      notes: notes || null,
      interactions: [],
      lastContact: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      isMock: false,
    }
    contact.score = calculateScore(contact)
    setUserContacts((prev) => {
      const next = [contact, ...prev]
      saveUserContacts(next)
      return next
    })
    return contact
  }, [])

  const updateContact = useCallback((id, updates) => {
    setUserContacts((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c
        const updated = { ...c, ...updates, updatedAt: new Date().toISOString() }
        updated.score = calculateScore(updated)
        return updated
      })
      saveUserContacts(next)
      return next
    })
  }, [])

  const archiveContact = useCallback((id) => {
    setUserContacts((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c)
      saveUserContacts(next)
      return next
    })
  }, [])

  const deleteContact = useCallback((id) => {
    setUserContacts((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveUserContacts(next)
      return next
    })
  }, [])

  return { contacts: allContacts, allTags, allCompanies, addContact, updateContact, archiveContact, deleteContact }
}

// ─── Mock NL Query Handler ──────────────────────────────────────

// TODO: Replace with actual Jinx NL processing via API
// POST http://{host}:{port}/api/crm/query
// Body: { query: string }
// Response: { answer: string, contacts: Contact[] }

export function handleNLQuery(query, contacts) {
  const q = query.toLowerCase().trim()

  if (/haven'?t spoken|30\+?\s*days|not contacted|no contact/.test(q)) {
    const stale = contacts.filter((c) => {
      if (!c.lastContact) return true
      return (Date.now() - new Date(c.lastContact).getTime()) / 86400000 > 30
    })
    if (stale.length === 0) {
      return { answer: "All your contacts have been reached in the last 30 days. Nice work!", contacts: [] }
    }
    return {
      answer: `Found ${stale.length} contact${stale.length !== 1 ? 's' : ''} you haven't spoken to in 30+ days:`,
      contacts: stale.sort((a, b) => {
        const aDate = a.lastContact ? new Date(a.lastContact) : new Date(0)
        const bDate = b.lastContact ? new Date(b.lastContact) : new Date(0)
        return aDate - bDate
      }),
    }
  }

  const fromMatch = q.match(/(?:from|at|with)\s+(.+?)(?:\s+(?:last|this|in|during)|\?|$)/i)
  if (fromMatch) {
    const companyQuery = fromMatch[1].replace(/[?"]/g, '').trim()
    const matches = contacts.filter((c) =>
      c.company && c.company.toLowerCase().includes(companyQuery)
    )
    if (matches.length > 0) {
      return {
        answer: `Found ${matches.length} contact${matches.length !== 1 ? 's' : ''} from "${matches[0].company}":`,
        contacts: matches,
      }
    }
    return { answer: `No contacts found from "${companyQuery}".`, contacts: [] }
  }

  const lastTalkMatch = q.match(/(?:last (?:talk|spoke|email|contact|met)|when did i.+(?:talk|speak|email|contact|meet))\s+(?:to|with)?\s*(.+?)(?:\?|$)/i)
  if (lastTalkMatch) {
    const nameQuery = lastTalkMatch[1].replace(/[?"]/g, '').trim()
    const match = contacts.find((c) => c.name.toLowerCase().includes(nameQuery))
    if (match) {
      if (match.lastContact) {
        const days = Math.floor((Date.now() - new Date(match.lastContact).getTime()) / 86400000)
        const latest = match.interactions?.[0]
        return {
          answer: `You last contacted **${match.name}** ${days} day${days !== 1 ? 's' : ''} ago${latest ? ` — "${latest.subject}"` : ''}.`,
          contacts: [match],
        }
      }
      return { answer: `${match.name} is in your contacts but has no recorded interactions yet.`, contacts: [match] }
    }
    return { answer: `No contact found matching "${nameQuery}".`, contacts: [] }
  }

  const highestMatch = q.match(/(?:highest|top|best)\s*(?:scored?|rated?|ranked?)/)
  if (highestMatch) {
    const companyFilter = q.match(/(?:at|from|with)\s+(.+?)(?:\?|$)/i)
    let pool = contacts
    if (companyFilter) {
      const cq = companyFilter[1].replace(/[?"]/g, '').trim()
      pool = contacts.filter((c) => c.company && c.company.toLowerCase().includes(cq))
    }
    const top = [...pool].sort((a, b) => b.score - a.score).slice(0, 5)
    if (top.length > 0) {
      return {
        answer: `Top ${top.length} highest-scored contacts${companyFilter ? ` at "${top[0].company}"` : ''}:`,
        contacts: top,
      }
    }
    return { answer: "No contacts found matching your criteria.", contacts: [] }
  }

  return {
    answer: "I'll need the full Jinx backend to answer that. For now, try the filters above.",
    contacts: [],
  }
}
