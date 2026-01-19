export interface IProductDetail {
  _id: string;
  name: string;
  description: string;
  price: number;
  inventoryCount: number;
  images: string[];
  slug: string;
  attributes?: string[];
  discount: number;
  rating?: number;
  isFavorite?: boolean;
  disabled?: boolean;
  optionColor?: { value: string; label: string }[];
}
