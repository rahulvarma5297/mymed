import { RequestWithUser } from '@/interfaces/auth.interface';
import { NextFunction, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

export const excelMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
export const imageMimes = ['image/jpeg', 'image/png', 'image/jpg'];
export const pdfMimes = ['application/pdf'];

/**
 * Middleware to upload a file to the server
 * @param mimeTypes Array of mime types to accept
 * @param destination Destination folder for the uploaded file
 * @returns
 */
export const uploaderMiddleware = (mimeTypes: string[], destination = './uploads') => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { id, uuid: uuuid } = req.user;
      const upload = multer({
        storage: multer.diskStorage({
          destination: function (req, file, cb) {
            //Get the path based on the mime type
            const rootPath = path.resolve(__dirname, '../..');
            const basePath = path.join(rootPath, destination);
            let uploadPath = basePath;
            if (excelMimes.includes(file.mimetype)) {
              uploadPath = path.join(basePath, 'excel');
            } else if (imageMimes.includes(file.mimetype)) {
              uploadPath = path.join(basePath, 'images');
            } else if (pdfMimes.includes(file.mimetype)) {
              uploadPath = path.join(basePath, 'pdf');
            }

            cb(null, uploadPath); // specify the upload directory
          },
          filename: function (req, file, cb) {
            const fileName = `${Date.now()}-${uuuid}-${uuid()}`;
            const extension = path.extname(file.originalname);
            cb(null, fileName + extension);
          },
        }),
        limits: {
          fileSize: 10000000,
        },
        fileFilter: (req, file, cb) => {
          if (!mimeTypes.includes(file.mimetype)) {
            cb(new Error('Only excel files are allowed!'));
          }
          cb(null, true);
        },
      }).single('file');

      upload(req, res, err => {
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    } catch (error) {
      next(error);
    }
  };
};
