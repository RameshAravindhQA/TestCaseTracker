import React from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { HandsOnTableSpreadsheet } from "@/components/spreadsheets/handsontable-spreadsheet";

export default function SpreadsheetsPage() {
  console.log('SpreadsheetsPage rendering...');

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Spreadsheets</h1>
          <p className="text-gray-600 mt-2">
            Create and manage spreadsheets for your test data and calculations.
          </p>
        </div>

        <div className="min-h-96">
          <HandsOnTableSpreadsheet />
        </div>
      </div>
    </MainLayout>
  );
}