import React, { useEffect } from 'react'
import InviteView from './InviteView'

export default function InviteScreen() {
  useEffect(() => {
    document.title = 'Invite a Friend — Vibez Citizens'
    return () => { document.title = 'Vibez Citizens' }
  }, [])

  return <InviteView />
}
