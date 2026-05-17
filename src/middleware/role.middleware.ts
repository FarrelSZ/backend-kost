import { Response, NextFunction } from "express";
import { IReqUser } from "../utils/interface";
import { ROLES } from "../utils/constants";

export const requireRole = (roles: ROLES[]) => {
  return (req: IReqUser, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        meta: { status: 403, message: "Akses ditolak: role tidak memiliki izin" },
        data: null,
      });
    }

    next();
  };
};
