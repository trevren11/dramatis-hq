"use client";

import { useState } from "react";
import { Inbox, ComposeMessage } from "@/components/messages";
import { Modal, ModalContent } from "@/components/ui/modal";

export default function MessagesPage(): React.ReactElement {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your conversations with talent and producers.
        </p>
      </div>

      <Inbox
        onCompose={() => {
          setShowCompose(true);
        }}
      />

      <Modal open={showCompose} onOpenChange={setShowCompose}>
        <ModalContent className="max-w-2xl p-0">
          <ComposeMessage
            onClose={() => {
              setShowCompose(false);
            }}
          />
        </ModalContent>
      </Modal>
    </div>
  );
}
