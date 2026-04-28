import jwt from "jsonwebtoken";
import { SECRET } from "./env";
import { IUserToken } from "./interface";

export const generateToken = (payload: IUserToken) => {
  const token = jwt.sign(payload, SECRET, {
    expiresIn: "2d",
  });
  return token;
};

export const verifyToken = (token: string) => {
  const user = jwt.verify(token, SECRET) as IUserToken;
  return user;
};
