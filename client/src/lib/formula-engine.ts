
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
    // Replace cell references like A1, B2, etc.
    return formula.replace(/\b[A-Z]+\d+\b/g, (match) => {
      const value = context[match];
      if (value === undefined || value === null) return '0';
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    });
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
