
import { MainLayout } from "@/components/layout/main-layout";
import { OnlyOfficeEditor } from "@/components/onlyoffice/onlyoffice-editor";

export default function OnlyOfficePage() {
  return (
    <MainLayout>
      <div className="h-full">
        <OnlyOfficeEditor />
      </div>
    </MainLayout>
  );
}
