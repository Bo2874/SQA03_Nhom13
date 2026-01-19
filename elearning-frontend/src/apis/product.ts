import axiosRequest from "@/config/axios";

export const getProducts = async () => {
  try {
    const res = await axiosRequest.get("products");
    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getDetailProduct = async (id: string) => {
  try {
    const res = await axiosRequest.get(`products/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
};
