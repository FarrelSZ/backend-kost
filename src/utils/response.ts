import { Response } from "express";
import * as Yup from "yup";
import mongoose from "mongoose";

type Pagination = {
  totalPages: number;
  current: number;
  total: number;
};

export default {
  success(res: Response, data: any, message: string) {
    res.status(200).json({
      meta: {
        status: "success",
        message,
      },
      data,
    });
  },

  created(res: Response, data: any, message: string) {
    res.status(201).json({
      meta: {
        status: "success",
        message,
      },
      data,
    });
  },

  pagination(res: Response, data: any[], pagination: Pagination, message: string) {
    res.status(200).json({
      meta: {
        status: "success",
        message,
      },
      data,
      pagination,
    });
  },

  //   Error responses

  error(res: Response, error: unknown, message: string) {
    if (error instanceof Yup.ValidationError) {
      const errors =
        error.inner.length > 0
          ? Object.fromEntries(error.inner.map((e) => [e.path, e.message]))
          : { [error.path ?? "value"]: error.errors[0] };

      return res.status(400).json({
        meta: {
          status: 400,
          message,
        },
        data: errors,
      });
    }

    if (error instanceof mongoose.Error) {
      return res.status(500).json({
        meta: {
          status: 500,
          message: error.message,
        },
        data: error.name,
      });
    }

    if ((error as any)?.code) {
      const _err = error as any;
      return res.status(500).json({
        meta: {
          status: 500,
          message: _err?.errorResponse?.errmsg || "server error",
        },
        data: _err,
      });
    }

    res.status(500).json({
      meta: {
        status: 500,
        message,
      },
      data: error,
    });
  },

  unauthorized(res: Response, message: string) {
    res.status(401).json({
      meta: {
        status: "unauthorized",
        message,
      },
      data: null,
    });
  },

  notFound(res: Response, message = "Data not found") {
    res.status(404).json({
      meta: {
        status: "error",
        message,
      },
      data: null,
    });
  },
};
