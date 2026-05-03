import { Request, Response } from "express";
import { IReqUser } from "../utils/interface";
import UserModel, { userDTO, userLoginDTO, userUpdatePasswordDTO } from "../models/user.model";
import response from "../utils/response";
import bcrypt from "bcrypt";
import { generateRefreshToken, generateToken, verifyRefreshToken } from "../utils/jwt";
import { encrypt } from "../utils/encryption";
import redis from "../utils/redis";

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 hari dalam detik

export default {
  async register(req: Request, res: Response) {
    const { name, email, phone, password } = req.body;
    try {
      await userDTO.validate({ name, email, phone, password });
      const result = await UserModel.create({ name, email, phone, password });
      response.created(res, result, "User berhasil didaftarkan");
    } catch (error) {
      response.error(res, error, "Gagal mendaftarkan user");
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      await userLoginDTO.validate({ email, password });

      const user = await UserModel.findOne({ email });
      if (!user) return response.unauthorized(res, "Email salah");

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return response.unauthorized(res, "Password salah");

      const token = generateToken({ id: user._id, role: user.role });
      const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

      await redis.set(`refresh:${user._id}`, refreshToken, { EX: REFRESH_TOKEN_TTL });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_TTL * 1000,
      });

      response.success(res, { token }, "Login berhasil");
    } catch (error) {
      response.error(res, error, "Gagal login");
    }
  },

  async me(req: IReqUser, res: Response) {
    try {
      const result = await UserModel.findById(req.user?.id);
      response.success(res, result, "Berhasil mendapatkan profil user");
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan profil user");
    }
  },

  async updatePassword(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { oldPassword, newPassword } = req.body;

      await userUpdatePasswordDTO.validate({ oldPassword, newPassword });

      const user = await UserModel.findById(userId);
      if (!user) return response.notFound(res, "User tidak ditemukan");

      const validOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validOldPassword) return response.unauthorized(res, "Password lama salah");

      const hashedPassword = await encrypt(newPassword);
      await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });

      response.success(res, null, "Password berhasil diubah");
    } catch (error) {
      response.error(res, error, "Gagal mengubah password");
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return response.unauthorized(res, "Refresh token tidak ditemukan");

      const payload = verifyRefreshToken(token);
      if (!payload.id) return response.unauthorized(res, "Token tidak valid");

      const stored = await redis.get(`refresh:${payload.id.toString()}`);
      if (!stored || stored !== token) {
        return response.unauthorized(res, "Token tidak valid atau sudah kadaluarsa");
      }

      const newAccessToken = generateToken({ id: payload.id, role: payload.role });
      response.success(res, { token: newAccessToken }, "Token berhasil diperbarui");
    } catch (error) {
      response.error(res, error, "Gagal memperbarui token");
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        try {
          const payload = verifyRefreshToken(token);
          if (payload.id) await redis.del(`refresh:${payload.id.toString()}`);
        } catch {
          // Token sudah expired/invalid, tetap lanjut hapus cookie
        }
      }
      res.clearCookie("refreshToken");
      response.success(res, null, "Logout berhasil");
    } catch (error) {
      response.error(res, error, "Gagal logout");
    }
  },
};
