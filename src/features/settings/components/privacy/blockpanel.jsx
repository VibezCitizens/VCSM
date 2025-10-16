// src/features/settings/components/privacy/PrivacyTab.jsx
import Card from '../components/Card';
import Row from '../components/Row';
import ProfilePrivacyToggle from '../../profiles/components/private/ProfilePrivacyToggle';
import BlockedUsersPanel from '@/features/settings/components/privacy/blockpanel';

export default function PrivacyTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm text-zinc-300 mb-3">
          Control who can see your profile and activity. New accounts start <b>public</b>.
        </div>
        <Row
          title="Profile visibility"
          subtitle="Public (default) or Private"
          right={<ProfilePrivacyToggle />}
        />
      </Card>

      <Card>
        <div className="px-2 pb-2">
          <h3 className="text-sm font-semibold">Blocked users</h3>
          <p className="text-xs text-zinc-400">Manage who can’t view or interact with you.</p>
        </div>
        <BlockedUsersPanel />
      </Card>
    </div>
  );
}
