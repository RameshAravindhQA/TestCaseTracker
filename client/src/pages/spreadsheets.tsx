import { MainLayout } from "@/components/layout/main-layout";
import { HandsOnTableSpreadsheet } from "@/components/spreadsheets/handsontable-spreadsheet";

export default function SpreadsheetsPage() {
  return (
    <MainLayout>
      <div className="h-full p-6">
        <HandsOnTableSpreadsheet />
      </div>
    </MainLayout>
  );
}