import { Types } from "mongoose";
import { ROLES } from "./constants";

export interface IUserToken {
  id?: Types.ObjectId;
  role: ROLES;
}

export interface IReqUser extends Request {
  user?: IUserToken;
}

export type Pagination = {
  totalPages: number;
  current: number;
  total: number;
};
