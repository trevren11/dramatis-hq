import { ConversationThread } from "@/components/messages";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conversationId } = await params;

  return (
    <div>
      <ConversationThread conversationId={conversationId} />
    </div>
  );
}
