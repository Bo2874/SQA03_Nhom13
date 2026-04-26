export interface IOption {
  value: string;
  label: string;
}

export interface ILocation {
  code: string;
  name: string;
  unit: string;
}

export interface IAddress {
  name: string;
  country: string;
  city: string;
  district: string;
  ward: string;
  specificAddress: string;
  phoneNumber: string;
  zip: string;
  primary: boolean;
  _id: string | undefined;
}
