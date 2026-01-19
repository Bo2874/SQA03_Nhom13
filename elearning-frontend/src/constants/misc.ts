export const REGEX_EMAIL = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{3,4}$";
export const REGEX_PASSWORD = "^.{5,}$";
export const REGEX_PHONE_NUMBER = /^[0-9]{10}$/;

export const toastErrorEndpoints = [
  "getUsers",
  "getOneUser",
  "getCurrentUser",
  "deleteUser",
];
