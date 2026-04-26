import { useEffect } from 'react'
import ContactView from './ContactView'

const PAGE_TITLE = 'Contact Vibez Citizens'
const PAGE_DESCRIPTION =
  'Reach Vibez Citizens for support, partnerships, privacy requests, or reports. Choose the right channel and we\'ll guide you from there.'
const PAGE_URL = 'https://vibezcitizens.com/contact'

function setMeta(property, content, isName = false) {
  const attr = isName ? 'name' : 'property'
  let el = document.head.querySelector(`meta[${attr}="${property}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  const prev = el.getAttribute('content')
  el.setAttribute('content', content)
  return () => {
    if (created) el.remove()
    else el.setAttribute('content', prev || '')
  }
}

export default function ContactScreen() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = PAGE_TITLE
    const cleanups = [
      setMeta('description', PAGE_DESCRIPTION, true),
      setMeta('og:title', PAGE_TITLE),
      setMeta('og:description', PAGE_DESCRIPTION),
      setMeta('og:url', PAGE_URL),
    ]
    return () => {
      document.title = prevTitle
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return <ContactView />
}
