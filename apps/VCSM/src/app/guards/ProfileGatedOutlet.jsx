import { Outlet } from 'react-router-dom'
import { CompleteProfileGate } from '@/features/auth/adapters/auth.adapter'

export default function ProfileGatedOutlet() {
  return (
    <CompleteProfileGate>
      <Outlet />
    </CompleteProfileGate>
  )
}
