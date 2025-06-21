import { customAlphabet } from "nanoid";

export type Id = string;

const ALPHANUMERIC =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NANOID_LENGTH = 16;

export const myNanoid = customAlphabet(ALPHANUMERIC, NANOID_LENGTH);
