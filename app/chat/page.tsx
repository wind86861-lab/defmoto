import { PageShell } from '@/components/layout/PageShell';
import { ChatClient } from '@/features/chat/ChatClient';

export default function ChatPage() {
  return (
    <PageShell hideHeader hideFooter hideBottomNav>
      <ChatClient />
    </PageShell>
  );
}
