import { MainLayout } from "@/components/layout/main-layout";
import { SimpleEnhancedMessenger } from "@/components/chat/simple-enhanced-messenger";

export default function EnhancedMessengerPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <SimpleEnhancedMessenger />
      </div>
    </MainLayout>
  );
}