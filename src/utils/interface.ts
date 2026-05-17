import { Request } from "express";
import { Types } from "mongoose";
import { ROLES } from "./constants";

export interface IUserToken {
  id?: Types.ObjectId;
  role: ROLES;
}

export interface IReqUser extends Request {
  user?: IUserToken;
}

export interface IPaginationQuery {
  page: number;
  limit: number;
  search?: string;
}
