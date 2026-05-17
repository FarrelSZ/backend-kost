import { Response, NextFunction } from "express";
import { IReqUser } from "../utils/interface";
import { verifyToken } from "../utils/jwt";
import redis from "../utils/redis";

export default async function authMiddleware(req: IReqUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ meta: { status: 401, message: "Unauthorized" }, data: null });
  }

  const token = authHeader.split(" ")[1];

  try {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ meta: { status: 401, message: "Token sudah tidak valid" }, data: null });
    }

    const user = verifyToken(token);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ meta: { status: 401, message: "Token tidak valid" }, data: null });
  }
}
