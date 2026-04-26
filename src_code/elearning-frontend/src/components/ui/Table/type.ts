import { ReactNode, CSSProperties } from "react";
import { PaginationProps } from "../Pagination";

export const TYPE_COLUMN = {
  TEXT: "text",
  IMAGE: "image",
  BADGE: "badge",
  ACTION: "action",
  TIME: "time",
};

export interface Column<T> {
  key: string;
  title: string;
  type?: string;
  className?: string;
  style?: CSSProperties;
  render?: (value: ReactNode, item: T, index: number) => ReactNode;
  classBadges?: Record<string, string>;
  actions?: Action<T>[];
  isQuickLook?: boolean;
  booleanText?: Record<string, string>;
}

export interface Action<T> {
  onClick: (item: T) => void;
  tooltip?: string;
  icon?: ReactNode;
  isDisableAction?: boolean;
}

export interface RowSelection<T> {
  selectedRowKey?: keyof T;
  onChange?: (selectedKeys: T[keyof T][]) => void;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: string;
  rowSelection?: RowSelection<T>;
  noDataChildren?: ReactNode;
  classNodata?: string;
  pagination?: PaginationProps;
  isLoading?: boolean;
  className?: string;
}
