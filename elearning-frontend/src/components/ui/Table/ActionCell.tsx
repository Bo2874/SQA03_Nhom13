import { cn } from "@/config/utils";
import { Action } from "./type";

export interface ActionCellProps<T> {
  actions: Action<T>[];
  item: T;
}

const ActionCell = <T,>({ actions = [], item }: ActionCellProps<T>) => {
  return (
    <div className="flex gap-3 justify-center">
      {actions?.map((action, index) => {
        const { onClick, tooltip, icon, isDisableAction } = action;

        return (
          <div key={index} className="relative flex justify-center group">
            <span
              onClick={() => onClick?.(item)}
              className={cn(
                "cursor-pointer",
                isDisableAction && "pointer-events-none opacity-30"
              )}
            >
              {icon}
            </span>

            {tooltip && !isDisableAction && (
              <div
                className={`absolute hidden group-hover:block px-4 py-3 bg-white text-xs rounded-lg shadow-md z-10 
                                whitespace-nowrap -top-[55px] left-1/2 transform -translate-x-1/2`}
              >
                {tooltip}
                <div className="absolute top-[32px] left-1/2 transform -translate-x-1/2">
                  <div className="w-3 h-3 bg-white transform rotate-45" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActionCell;
