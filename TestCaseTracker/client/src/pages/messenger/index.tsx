
import { MainLayout } from "@/components/layout/main-layout";
import { Messenger } from "@/components/chat/messenger";
import { MessengerUnitTest } from "@/components/messenger/messenger-unit-test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MessengerPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <Tabs defaultValue="chat" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="test">Unit Test</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="h-full">
            <Messenger />
          </TabsContent>
          <TabsContent value="test" className="h-full">
            <div className="p-6">
              <MessengerUnitTest />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
