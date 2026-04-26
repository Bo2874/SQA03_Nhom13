import axiosRequest from "@/config/axios";

export const getCategory = async () => {
  try {
    const res = await axiosRequest.get("/categories");
    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
};
