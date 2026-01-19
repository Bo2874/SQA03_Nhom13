import { cn } from "@/config/utils";
import { useState, useEffect } from "react";
import Pagination from "../Pagination";
import Spin from "../Spin";
import Checkbox from "../Checkbox";
import { ImageCell } from "./ImageCell";
import ActionCell from "./ActionCell";
import { TableProps, TYPE_COLUMN } from "./type";

const Table = <T,>({
  data,
  columns,
  rowKey,
  rowSelection,
  noDataChildren,
  classNodata,
  pagination,
  isLoading = false,
  className,
}: TableProps<T>) => {
  const [selectedValues, setSelectedValues] = useState<T[keyof T][]>([]);

  const getColumnValue = (item: T, keyValue: string) => {
    return keyValue.split(".").reduce((acc: any, key: string) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key];
      }
      return undefined;
    }, item);
  };

  const mainColKey: keyof T =
    (rowSelection?.selectedRowKey as keyof T) || (rowKey as keyof T);

  useEffect(() => {
    rowSelection?.onChange?.(selectedValues);
  }, [selectedValues, rowSelection]);

  const toggleSelectAll = (isChecked: boolean) => {
    const selectedValuesWithGivenKey = isChecked
      ? data.map((item) => item[mainColKey])
      : [];
    setSelectedValues(selectedValuesWithGivenKey);
  };

  const toggleSelect = (item: T) => {
    setSelectedValues((prevSelected) => {
      const itemKeyValue = item[mainColKey];
      if (prevSelected.includes(itemKeyValue)) {
        return prevSelected.filter((id) => id !== itemKeyValue);
      } else {
        return [...prevSelected, itemKeyValue];
      }
    });
  };

  return (
    <>
      <div className={cn("scrollbarStyle w-full overflow-x-auto", className)}>
        <table className="min-w-full table-auto">
          <thead className="bg-white-600">
            <tr>
              {rowSelection && (
                <th scope="col" className="p-4 w-12">
                  <Checkbox
                    onChange={(isChecked) => toggleSelectAll(isChecked)}
                    checked={
                      data?.length > 0 && selectedValues.length === data.length
                    }
                  />
                </th>
              )}

              {columns.map((column, index) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "py-4 text-base text-center font-normal text-dark-800",
                    column.className
                  )}
                  style={column.style}
                >
                  <div
                    className={cn(
                      "border-0 px-4",
                      (index || (rowSelection && !index)) &&
                        "border-l border-dark-200"
                    )}
                  >
                    {column.title}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white border-t border-b border-gray-300">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="p-0"
                >
                  <div className="w-full h-60 flex items-center justify-center">
                    <Spin
                      isLoading={isLoading}
                      className="text-dark-300 fill-primary-600"
                    >
                      <p className="text-center">Đang tải dữ liệu...</p>
                    </Spin>
                  </div>
                </td>
              </tr>
            ) : (
              data?.map((item, index) => (
                <tr
                  key={item[rowKey as keyof T] as string}
                  className={cn(
                    index !== data?.length - 1 && "border-b",
                    selectedValues.includes(item[mainColKey]) && "bg-white-900"
                  )}
                >
                  {rowSelection && (
                    <td className="p-4 min-w-12">
                      <Checkbox
                        checked={selectedValues.includes(item[mainColKey])}
                        onChange={() => toggleSelect(item)}
                      />
                    </td>
                  )}

                  {columns.map((column, index) => {
                    const {
                      type,
                      key,
                      render,
                      classBadges,
                      actions,
                      isQuickLook,
                      booleanText,
                    } = column;
                    const itemKeyValue = getColumnValue(item, key);

                    return (
                      <td
                        key={key}
                        className={cn(
                          "p-4 text-sm text-center font-normal text-dark-800",
                          column.className
                        )}
                      >
                        {render ? (
                          <>{render(itemKeyValue, item, index)}</>
                        ) : (
                          <>
                            {(type === TYPE_COLUMN.TEXT || !type) && (
                              <span className="text-ellipsis">
                                {itemKeyValue}
                              </span>
                            )}
                            {type === TYPE_COLUMN.IMAGE && (
                              <ImageCell
                                itemKeyValue={itemKeyValue}
                                isQuickLook={isQuickLook}
                              />
                            )}
                            {type === TYPE_COLUMN.BADGE && (
                              <span
                                className={
                                  classBadges?.[itemKeyValue] || "text-gray"
                                }
                              >
                                {booleanText?.[itemKeyValue] || itemKeyValue}
                              </span>
                            )}
                            {type === TYPE_COLUMN.ACTION && (
                              <ActionCell actions={actions || []} item={item} />
                            )}
                            {type === TYPE_COLUMN.TIME && (
                              <span>{itemKeyValue}</span>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data?.length === 0 &&
          !isLoading &&
          (noDataChildren || (
            <p
              className={cn(
                "text-base h-60 flex items-center justify-center",
                classNodata
              )}
            >
              Không có dữ liệu
            </p>
          ))}
      </div>
      {pagination && <Pagination {...pagination} className="my-4" />}
    </>
  );
};

export default Table;
