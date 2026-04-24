"use client";

import { useRouter } from "next/navigation";
import { ComposeMessage } from "@/components/messages";

export default function ComposeMessagePage(): React.ReactElement {
  const router = useRouter();

  const handleClose = (): void => {
    router.push("/messages");
  };

  return (
    <div className="container flex max-w-2xl items-center justify-center py-12">
      <ComposeMessage onClose={handleClose} />
    </div>
  );
}
