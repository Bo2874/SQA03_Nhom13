import { useFormContext, get } from "react-hook-form";
import React from "react";
import ErrorMessage from "./ErrorMessage";

interface FormErrorProps {
  name: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ name, className }) => {
  const { formState } = useFormContext();
  const error = get(formState.errors, name);
  if (!error) return null;

  return <ErrorMessage message={error.message} className={className} />;
};

export default FormError;
