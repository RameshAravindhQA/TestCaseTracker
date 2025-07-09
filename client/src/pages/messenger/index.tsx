
import { Messenger } from "@/components/chat/messenger";
import { MainLayout } from "@/components/layout/main-layout";

export default function MessengerPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <Messenger />
      </div>
    </MainLayout>
  );
}
