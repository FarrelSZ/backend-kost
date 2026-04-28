import bcrypt from "bcrypt";

export const encrypt = (password: string) => {
  const encrypted = bcrypt.hash(password, 10);
  return encrypted;
};
