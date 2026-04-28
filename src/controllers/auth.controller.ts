import { Request, Response } from "express";
import { IReqUser } from "../utils/interface";
import UserModel, { userDTO } from "../models/user.model";

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
      const result = await UserModel.create({});
    } catch (error) {}
  },
};
