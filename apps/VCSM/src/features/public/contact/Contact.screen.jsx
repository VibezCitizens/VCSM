import { useEffect } from 'react'
import ContactView from './Contact.view'

const PAGE_TITLE = 'Contact Vibez Citizens'
const PAGE_DESCRIPTION =
  'Contact Vibez Citizens for support, business inquiries, privacy requests, or reports.'

export default function ContactScreen() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = PAGE_TITLE

    let descEl = document.head.querySelector('meta[name="description"]')
    const created = !descEl
    if (!descEl) {
      descEl = document.createElement('meta')
      descEl.setAttribute('name', 'description')
      document.head.appendChild(descEl)
    }
    const prevDesc = descEl.getAttribute('content')
    descEl.setAttribute('content', PAGE_DESCRIPTION)

    return () => {
      document.title = prevTitle
      if (created) {
        descEl.remove()
      } else {
        descEl.setAttribute('content', prevDesc || '')
      }
    }
  }, [])

  return <ContactView />
}
