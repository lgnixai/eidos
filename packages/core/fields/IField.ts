import { FieldType } from "./const";


export type IField<T = any> = {
  name: string;
  type: FieldType;
  table_column_name: string;
  table_name: string;
  property: T;
  created_at?: string;
  updated_at?: string;
};
