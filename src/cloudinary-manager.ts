const cloudinary = require('cloudinary').v2;
const fs = require('fs');
import { uniqueValue } from './chamber';

export interface IUploadFile {
  error: boolean;
  filename?: string;
  image_path?: string;
  message?: string;
}

export function upload_file(file: any): Promise<IUploadFile> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject({error: true, filename: undefined, image_path: undefined, message: 'no file given...'});
    }
    const unique_filename = uniqueValue();
    const filename = unique_filename + (<string> file.name);
    const image_path = __dirname + '/' + filename;
    file.mv(filename, (error: any) => {
      if (error) {
        return reject({error: true, filename: undefined, image_path: undefined, message: 'could not upload file...'});
      } else {
        return resolve({ error: false, filename, image_path, message: undefined });
      }
    });
  });
}

export interface IStoreImage {
  error: boolean;
  message?: string;
  filedata: IUploadFile;
  result?: {
    public_id: string;
    secure_url: string;
  };
}

export function store_image(file: any, public_id?: string): Promise<IStoreImage> {
  return new Promise(async (resolve, reject) => {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    const oneCredentialMissing = (!cloud_name || !api_key || !api_secret);

    if (oneCredentialMissing) {
      console.log({ file, public_id, cloud_name, api_key, api_secret });
      const errorObj = {
        error: true,
        results: undefined,
        message: `One cloudinary credential is missing; upload attempt canceled.`
      };
      return reject(errorObj);
    }

    const filedata = await upload_file(file);
    if (filedata.error) {
      const errorObj = { error: filedata.error, message: filedata.message };
      return reject(errorObj);
    }

    cloudinary.config({ cloud_name, api_key, api_secret });

    if (public_id) {
      console.log('deleting cloud image with public_id:', public_id);
      cloudinary.uploader.destroy(public_id, (error: any, result: any) => {
        if (error) {
          console.log('error deleting...', error);
        } else {
          console.log(
            'deleted from cloudinary successfully!',
            'public_id: ' + public_id,
            'result: ', result
          );
        }
      });
    }

    cloudinary.uploader.upload(filedata.filename, (error: any, result: any) => {
      fs.unlink(filedata.filename, (err: any) => {
        if (err) {
          console.log(err);
        } else {
          console.log(
            'file deleted successfully!',
            filedata.filename
          );
        }
      });

      console.log({ error });
      return result && result.secure_url ?
        resolve({ error: false, result, filedata }) :
        reject({ error: true, result, filedata });
    });
  });
}
