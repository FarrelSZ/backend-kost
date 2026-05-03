import jwt from "jsonwebtoken";
import { REFRESH_SECRET, SECRET } from "./env";
import { IUserToken } from "./interface";

export const generateToken = (payload: IUserToken) => {
  const token = jwt.sign(payload, SECRET, {
    expiresIn: "1h",
  });
  return token;
};

export const verifyToken = (token: string) => {
  const user = jwt.verify(token, SECRET) as IUserToken;
  return user;
};

export const generateRefreshToken = (payload: IUserToken) => {
  const token = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "30d",
  });
  return token;
};

export const verifyRefreshToken = (token: string) => {
  const user = jwt.verify(token, REFRESH_SECRET) as IUserToken;
  return user;
};
