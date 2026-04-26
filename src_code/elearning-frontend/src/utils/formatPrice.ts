export const formatPrice = (price: number) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
};

export const calculateCurrentPrice = (price: number, discount: number) => {
  return parseFloat((price * (1 - discount / 100)).toFixed(0));
};

export const calculateDiscountPrice = (price: number, currentPrice: number) => {
  return parseFloat((price - currentPrice).toFixed(0));
};
