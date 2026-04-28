import jwt from "jsonwebtoken";
import { SECRET } from "./env";

export const generateToken = (payload: string) => {
  const token = jwt.sign(payload, SECRET, {
    expiresIn: "2d",
  });
  return token;
};

export const verifyToken = (token: string) => {
  const user = jwt.verify(token, SECRET);
  return user;
};
