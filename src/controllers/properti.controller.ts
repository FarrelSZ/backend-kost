import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interface";
import PropertyModel, { propertyDTO, TypeProperty } from "../models/property.model";
import response from "../utils/response";
import { isValidObjectId, QueryFilter } from "mongoose";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const { name, address, city, phone, rules, wifi_password, total_rooms } = req.body;

      await propertyDTO.validate(
        { name, address, city, phone, rules, wifi_password, total_rooms },
        { abortEarly: false },
      );

      isValidObjectId;

      const result = await PropertyModel.create({
        owner_id: req.user?.id,
        name,
        address,
        city,
        phone,
        rules,
        wifi_password,
        total_rooms,
      });

      response.created(res, result, "Properti berhasil ditambahkan");
    } catch (error) {
      response.error(res, error, "Gagal menambahkan properti");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    try {
      const { limit = 10, page = 1, search } = req.query as unknown as IPaginationQuery;
      const query: QueryFilter<TypeProperty> = {};

      if (search) {
        Object.assign(query, {
          $or: [
            {
              name: { $regex: search, $options: "i" },
            },
            {
              city: { $regex: search, $options: "i" },
            },
          ],
        });
      }

      const result = await PropertyModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await PropertyModel.countDocuments(query);
      response.pagination(
        res,
        result,
        { current: page, total: count, totalPages: Math.ceil(count / limit) },
        "Berhasil mendapatkan daftar properti",
      );
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan daftar properti");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "ID properti tidak valid");
      }

      const result = await PropertyModel.findById(id).exec();
      if (!result) {
        return response.notFound(res, "Properti tidak ditemukan");
      }
      response.success(res, result, "Berhasil mendapatkan detail properti");
    } catch (error) {
      response.error(res, error, "Gagal mendapatkan properti");
    }
  },

  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "ID properti tidak valid");
      }

      const result = await PropertyModel.findByIdAndUpdate(id, { new: true }).exec();
      if (!result) {
        return response.notFound(res, "Gagal memperbarui properti");
      }
      response.success(res, result, "Berhasil memperbarui properti");
    } catch (error) {
      response.error(res, error, "Gagal memperbarui properti");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return response.notFound(res, "ID properti tidak valid");
      }
      const result = await PropertyModel.findByIdAndDelete(id).exec();
      if (!result) {
        return response.notFound(res, "Gagal menghapus properti");
      }
      response.success(res, result, "Berhasil menghapus properti");
    } catch (error) {
      response.error(res, error, "Gagal menghapus properti");
    }
  },
};
