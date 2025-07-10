
export interface TestSheet {
  id: number;
  name: string;
  projectId: number;
  data: SheetData;
  metadata: SheetMetadata;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsertTestSheet {
  name: string;
  projectId: number;
  data: SheetData;
  metadata: SheetMetadata;
  createdById: number;
}

export interface SheetData {
  cells: Record<string, CellData>;
  rows: number;
  cols: number;
}

export interface CellData {
  value: any;
  formula?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'formula';
  style?: CellStyle;
  validation?: CellValidation;
}

export interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  border?: BorderStyle;
}

export interface BorderStyle {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface CellValidation {
  type: 'list' | 'number' | 'date' | 'text';
  criteria: any;
  errorMessage?: string;
}

export interface SheetMetadata {
  version: number;
  lastModifiedBy: number;
  collaborators: number[];
  chartConfigs: ChartConfig[];
  namedRanges: NamedRange[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'column';
  title: string;
  dataRange: string;
  position: { x: number; y: number; width: number; height: number };
}

export interface NamedRange {
  name: string;
  range: string;
  description?: string;
}

export interface FormulaEngine {
  evaluate(formula: string, context: Record<string, any>): any;
  getDependencies(formula: string): string[];
}

export interface SheetChange {
  id: string;
  userId: number;
  timestamp: string;
  type: 'cell_update' | 'row_insert' | 'row_delete' | 'col_insert' | 'col_delete';
  data: any;
  previousData?: any;
}
