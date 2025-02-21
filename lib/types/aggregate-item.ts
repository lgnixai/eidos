export interface AggregateItem {
  column: string;
  function: "sum" | "avg" | "count" | "min" | "max" | "count_distinct";
  alias?: string;
} 