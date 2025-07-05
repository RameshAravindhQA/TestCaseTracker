export class FormulaEngine {
  private functions: Record<string, Function> = {};

  constructor() {
    this.initializeFunctions();
  }

  private initializeFunctions() {
    // Mathematical functions
    this.functions.SUM = (...args: any[]) => {
      return args.flat().reduce((sum, val) => sum + (Number(val) || 0), 0);
    };

    this.functions.AVERAGE = (...args: any[]) => {
      const values = args.flat().filter(val => !isNaN(Number(val)));
      return values.length > 0 ? this.functions.SUM(...values) / values.length : 0;
    };

    this.functions.COUNT = (...args: any[]) => {
      return args.flat().filter(val => !isNaN(Number(val))).length;
    };

    this.functions.COUNTA = (...args: any[]) => {
      return args.flat().filter(val => val !== null && val !== undefined && val !== '').length;
    };

    this.functions.MAX = (...args: any[]) => {
      const values = args.flat().filter(val => !isNaN(Number(val))).map(Number);
      return values.length > 0 ? Math.max(...values) : 0;
    };

    this.functions.MIN = (...args: any[]) => {
      const values = args.flat().filter(val => !isNaN(Number(val))).map(Number);
      return values.length > 0 ? Math.min(...values) : 0;
    };

    // Advanced mathematical functions
    this.functions.POWER = (base: number, exponent: number) => {
      return Math.pow(Number(base), Number(exponent));
    };

    this.functions.SQRT = (value: number) => {
      return Math.sqrt(Number(value));
    };

    this.functions.ABS = (value: number) => {
      return Math.abs(Number(value));
    };

    this.functions.ROUND = (value: number, digits: number = 0) => {
      const multiplier = Math.pow(10, Number(digits));
      return Math.round(Number(value) * multiplier) / multiplier;
    };

    this.functions.CEILING = (value: number) => {
      return Math.ceil(Number(value));
    };

    this.functions.FLOOR = (value: number) => {
      return Math.floor(Number(value));
    };

    this.functions.MOD = (dividend: number, divisor: number) => {
      return Number(dividend) % Number(divisor);
    };

    this.functions.PI = () => {
      return Math.PI;
    };

    this.functions.E = () => {
      return Math.E;
    };

    this.functions.SIN = (value: number) => {
      return Math.sin(Number(value));
    };

    this.functions.COS = (value: number) => {
      return Math.cos(Number(value));
    };

    this.functions.TAN = (value: number) => {
      return Math.tan(Number(value));
    };

    this.functions.ASIN = (value: number) => {
      return Math.asin(Number(value));
    };

    this.functions.ACOS = (value: number) => {
      return Math.acos(Number(value));
    };

    this.functions.ATAN = (value: number) => {
      return Math.atan(Number(value));
    };

    this.functions.LOG = (value: number, base: number = Math.E) => {
      return Math.log(Number(value)) / Math.log(Number(base));
    };

    this.functions.LOG10 = (value: number) => {
      return Math.log10(Number(value));
    };

    this.functions.EXP = (value: number) => {
      return Math.exp(Number(value));
    };

    this.functions.RANDOM = () => {
      return Math.random();
    };

    this.functions.RANDBETWEEN = (min: number, max: number) => {
      const minVal = Math.ceil(Number(min));
      const maxVal = Math.floor(Number(max));
      return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    };

    // Text functions
    this.functions.CONCATENATE = (...args: any[]) => {
      return args.flat().join('');
    };

    this.functions.LEFT = (text: string, numChars: number) => {
      return String(text).substring(0, numChars);
    };

    this.functions.RIGHT = (text: string, numChars: number) => {
      const str = String(text);
      return str.substring(str.length - numChars);
    };

    this.functions.MID = (text: string, start: number, numChars: number) => {
      return String(text).substring(start - 1, start - 1 + numChars);
    };

    this.functions.LEN = (text: string) => {
      return String(text).length;
    };

    this.functions.UPPER = (text: string) => {
      return String(text).toUpperCase();
    };

    this.functions.LOWER = (text: string) => {
      return String(text).toLowerCase();
    };

    // Date functions
    this.functions.TODAY = () => {
      return new Date().toISOString().split('T')[0];
    };

    this.functions.NOW = () => {
      return new Date().toISOString();
    };

    this.functions.YEAR = (date: string) => {
      return new Date(date).getFullYear();
    };

    this.functions.MONTH = (date: string) => {
      return new Date(date).getMonth() + 1;
    };

    this.functions.DAY = (date: string) => {
      return new Date(date).getDate();
    };

    // Logical functions
    this.functions.IF = (condition: boolean, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue;
    };

    this.functions.AND = (...args: any[]) => {
      return args.flat().every(val => Boolean(val));
    };

    this.functions.OR = (...args: any[]) => {
      return args.flat().some(val => Boolean(val));
    };

    this.functions.NOT = (value: any) => {
      return !Boolean(value);
    };
  }

  evaluate(formula: string, context: Record<string, any>): any {
    try {
      // Remove the = sign if present
      const cleanFormula = formula.startsWith('=') ? formula.substring(1) : formula;

      // Replace cell references with actual values
      let processedFormula = this.replaceCellReferences(cleanFormula, context);

      // Replace function calls
      processedFormula = this.replaceFunctionCalls(processedFormula);

      // Evaluate the expression
      return this.safeEval(processedFormula);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR!';
    }
  }

  private replaceCellReferences(formula: string, context: Record<string, any>): string {
    // Replace range references like A1:A10 first
    formula = formula.replace(/\b([A-Z]+\d+):([A-Z]+\d+)\b/g, (match, start, end) => {
      const range = this.expandRange(start, end, context);
      return `[${range.join(',')}]`;
    });

    // Replace single cell references like A1, B2, etc.
    return formula.replace(/\b[A-Z]+\d+\b/g, (match) => {
      const value = context[match];
      if (value === undefined || value === null) return '0';
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    });
  }

  private expandRange(startCell: string, endCell: string, context: Record<string, any>): number[] {
    const startMatch = startCell.match(/([A-Z]+)(\d+)/);
    const endMatch = endCell.match(/([A-Z]+)(\d+)/);

    if (!startMatch || !endMatch) return [];

    const startCol = this.columnLetterToNumber(startMatch[1]);
    const startRow = parseInt(startMatch[2]);
    const endCol = this.columnLetterToNumber(endMatch[1]);
    const endRow = parseInt(endMatch[2]);

    const values: number[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellId = this.numberToColumnLetter(col) + row;
        const value = context[cellId];
        if (!isNaN(Number(value))) {
          values.push(Number(value));
        }
      }
    }

    return values;
  }

  private columnLetterToNumber(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result;
  }

  private numberToColumnLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  private replaceFunctionCalls(formula: string): string {
    // Replace function calls with their implementations
    const functionPattern = /\b([A-Z]+)\s*\(/g;

    return formula.replace(functionPattern, (match, funcName) => {
      if (this.functions[funcName]) {
        return `this.functions.${funcName}(`;
      }
      return match;
    });
  }

  private safeEval(expression: string): any {
    try {
      // Handle basic arithmetic operations first
      if (this.isSimpleArithmetic(expression)) {
        return this.evaluateArithmetic(expression);
      }

      // Create a safe evaluation context
      const func = new Function('functions', `
        const { ${Object.keys(this.functions).join(', ')} } = functions;
        return ${expression};
      `);

      return func(this.functions);
    } catch (error) {
      return '#ERROR!';
    }
  }

  private isSimpleArithmetic(expression: string): boolean {
    // Check if expression contains only numbers, operators, and parentheses
    return /^[\d\s+\-*/().]+$/.test(expression);
  }

  private evaluateArithmetic(expression: string): number {
    try {
      // Use Function constructor for safe arithmetic evaluation
      const func = new Function('return ' + expression);
      const result = func();
      return typeof result === 'number' ? result : Number(result);
    } catch (error) {
      throw new Error('Invalid arithmetic expression');
    }
  }

  getDependencies(formula: string): string[] {
    const dependencies: string[] = [];
    const cellPattern = /\b[A-Z]+\d+\b/g;
    let match;

    while ((match = cellPattern.exec(formula)) !== null) {
      if (!dependencies.includes(match[0])) {
        dependencies.push(match[0]);
      }
    }

    return dependencies;
  }
}

export const formulaEngine = new FormulaEngine();