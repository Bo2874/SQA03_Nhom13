import axiosRequest from "../config/axios";

export const getTodos = async () => {
  const res = await axiosRequest.get<number[]>(
    "https://jsonplaceholder.typicode.com/todos"
  );
  return res.data;
};
