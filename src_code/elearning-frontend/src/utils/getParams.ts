export const getParams = (param: string): string | null => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }
  return null;
};
