
import { MainLayout } from "@/components/layout/main-layout";
import Messenger from "@/components/chat/messenger";

export default function MessengerPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <Messenger />
      </div>
    </MainLayout>
  );
}
