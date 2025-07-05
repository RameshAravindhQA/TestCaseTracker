import { MainLayout } from "@/components/layout/main-layout";
import { HandsontableIntegration } from "@/components/spreadsheet/handsontable-integration";

export default function SpreadsheetsPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <HandsontableIntegration />
      </div>
    </MainLayout>
  );
}