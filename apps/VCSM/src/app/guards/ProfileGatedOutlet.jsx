import { Outlet } from 'react-router-dom'
import CompleteProfileGate from '@/features/auth/screens/CompleteProfileGate'

export default function ProfileGatedOutlet() {
  return (
    <CompleteProfileGate>
      <Outlet />
    </CompleteProfileGate>
  )
}
