import { useEffect } from 'react'
import AboutView from './About.view'

const PAGE_TITLE = 'About Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn about Vibez Citizens, a platform for people and businesses to connect through profiles, messaging, local discovery, and shareable VPORT business cards.'

export default function AboutScreen() {
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

  return <AboutView />
}
