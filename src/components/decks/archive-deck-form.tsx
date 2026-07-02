import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ArchiveDeckForm({
  action,
}: {
  action: () => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <Button
        type="submit"
        variant="destructive"
        className="w-full justify-start"
      >
        <Archive aria-hidden="true" />
        Archive deck
      </Button>
    </form>
  );
}
