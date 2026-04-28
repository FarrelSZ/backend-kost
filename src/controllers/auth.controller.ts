import { Request, Response } from "express";
import { IReqUser } from "../utils/interface";
import UserModel, { userDTO, userLoginDTO, userUpdatePasswordDTO } from "../models/user.model";
import response from "../utils/response";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { encrypt } from "../utils/encryption";

export default {
  async register(req: Request, res: Response) {
    const { name, email, phone, password } = req.body;
    try {
      await userDTO.validate({
        name,
        email,
        phone,
        password,
      });
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

      //   Cek email
      const user = await UserModel.findOne({ email });
      if (!user) {
        return response.unauthorized(res, "Email salah");
      }

      //   Cek password
      const validatePassword = await bcrypt.compare(password, user.password);
      if (!validatePassword) {
        return response.unauthorized(res, "Password salah");
      }

      //   Generate token
      const token = generateToken({
        id: user._id,
        role: user.role,
      });

      response.success(res, token, "Login berhasil");
    } catch (error) {
      response.error(res, error, "Gagal login");
    }
  },

  async me(req: IReqUser, res: Response) {
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      response.success(res, result, "success get user profile");
    } catch (error) {
      response.error(res, error, "failed get user profile");
    }
  },

  async updatePassword(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { oldPassword, newPassword } = req.body;

      await userUpdatePasswordDTO.validate({ oldPassword, newPassword });

      const user = await UserModel.findById(userId);
      if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        return response.notFound(res, "User tidak ditemukan");
      }

      const result = await UserModel.findByIdAndUpdate(userId, { password: encrypt(newPassword) }, { new: true });

      response.success(res, result, "Password berhasil diubah");
    } catch (error) {
      response.error(res, error, "Gagal mengubah password");
    }
  },
};
