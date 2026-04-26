import { useFormContext, Controller, ControllerProps } from "react-hook-form";
import React, { ReactElement } from "react";
import FormError from "./FormError";

interface FieldControllerProps {
  name: string;
  required?: string;
  className?: string;
  title?: string;
  children: ReactElement;
  isUncontrolled?: boolean;
  defaultValue?: any;
  rules?: ControllerProps["rules"];
  [key: string]: any;
}

const FieldController: React.FC<FieldControllerProps> = (props) => {
  const {
    name,
    required,
    className,
    title,
    children,
    isUncontrolled,
    defaultValue,
    rules,
    ...rest
  } = props;
  const { control } = useFormContext();

  return (
    <div className={className}>
      {title && (
        <div className="table text-xl pb-3 capitalize">
          {title}
          {required && <span className="text-red ml-1.5">*</span>}
        </div>
      )}
      <Controller
        control={control}
        name={name}
        rules={{
          ...rules,
          ...{ required: required },
        }}
        defaultValue={defaultValue}
        render={({ field }) => (
          <>
            {React.cloneElement(children, {
              ...rest,
              ...field,
              value: field.value || "",
              defaultValue: defaultValue,
            })}
            {isUncontrolled && (
              <div className="h-0 overflow-hidden">
                <input className="h-0" readOnly ref={(ref) => field.ref(ref)} />
              </div>
            )}
          </>
        )}
      />
      <FormError name={name} />
    </div>
  );
};

export default FieldController;
