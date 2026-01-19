export * from "./misc";
export * from "./service";

export const NUMBER_REGEX = /^-?\d*\.?\d*$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const ACCESS_TOKEN = "ACCESS_TOKEN"; // Must match backend COOKIE_NAME
export const REFRESH_TOKEN = "REFRESH_TOKEN";
export const TOKEN = "token";
