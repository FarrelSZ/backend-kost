import { Response } from "express";
import { IReqUser } from "../utils/interface";
import UserModel, { userCreateByOwnerDTO, userUpdateDTO } from "../models/user.model";
import response from "../utils/response";

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const _page = Number(page);
      const _limit = Number(limit);
      const skip = (_page - 1) * _limit;
      const searchStr = String(search);

      const filter = searchStr
        ? {
            $or: [{ name: { $regex: searchStr, $options: "i" } }, { email: { $regex: searchStr, $options: "i" } }],
          }
        : {};

      const [data, total] = await Promise.all([
        UserModel.find(filter).skip(skip).limit(_limit).sort({ createdAt: -1 }),
        UserModel.countDocuments(filter),
      ]);

      response.pagination(
        res,
        data,
        { total, current: _page, totalPages: Math.ceil(total / _limit) },
        "Berhasil mendapatkan daftar user",
      );
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan daftar user");
    }
  },

  async findById(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserModel.findById(id);
      if (!result) return response.notFound(res, "User tidak ditemukan");

      response.success(res, result, "Berhasil mendapatkan user");
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan user");
    }
  },

  async create(req: IReqUser, res: Response) {
    try {
      await userCreateByOwnerDTO.validate(req.body, { abortEarly: false });
      const result = await UserModel.create(req.body);
      response.created(res, result, "User berhasil dibuat");
    } catch (error) {
      response.error(res, error, "Gagal membuat user");
    }
  },

  async me(req: IReqUser, res: Response) {
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      response.success(res, result, "Berhasil mendapatkan profil user");
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan profil user");
    }
  },

  async update(req: IReqUser, res: Response) {
    try {
      const user = req.user;
      if (!user?.id) return response.notFound(res, "User tidak ditemukan");
      const body = await userUpdateDTO.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const result = await UserModel.findByIdAndUpdate(user?.id, body, {
        new: true,
        runValidators: true,
      });

      response.success(res, result, "Berhasil memperbarui profil user");
    } catch (error) {
      response.error(res, error, "Gagal memperbarui profil user");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserModel.findByIdAndDelete(id, { new: true });
      if (!result) return response.notFound(res, "User tidak ditemukan");

      response.success(res, null, "User berhasil dihapus");
    } catch (error) {
      response.error(res, error, "Gagal menghapus user");
    }
  },
};
