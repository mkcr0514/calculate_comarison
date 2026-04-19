export interface Product {
  id: number;
  full: string;
  color: string;
  ph: string;
  min: number;
  max: number;
  fakeBase: number;
  ratios: Record<string, number | null>;
}

export interface Category {
  key: string;
  label: string;
  keys: string[];
}

export interface BenefitValue {
  amt: string;
  unit: string;
}
