import { Response } from "express";
import { IReqUser } from "../utils/interface";
import UserModel, { userUpdateDTO } from "../models/user.model";
import response from "../utils/response";

export default {
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
};
