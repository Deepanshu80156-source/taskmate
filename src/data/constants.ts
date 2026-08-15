// Shared class / grade list used across the entire app.
// Order: Nursery → LKG → UKG → Class 1 … Class 12
export const CLASS_LIST = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

export type ClassName = (typeof CLASS_LIST)[number];
