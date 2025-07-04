import { MainLayout } from "@/components/layout/main-layout";
import { SimpleEnhancedSpreadsheet } from "@/components/spreadsheet/simple-enhanced-spreadsheet";

export default function EnhancedSpreadsheetsPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <SimpleEnhancedSpreadsheet />
      </div>
    </MainLayout>
  );
}