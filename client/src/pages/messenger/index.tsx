
import { MainLayout } from "@/components/layout/main-layout";
import Messenger from "@/components/chat/messenger";

export default function MessengerPage() {
  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)]">
        <Messenger />
      </div>
    </MainLayout>
  );
}
