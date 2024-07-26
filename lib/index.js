"use strict";

/**
 * Module dependencies
 */

// Public node modules.
import { UploadClient } from '@uploadcare/upload-client'
import { errors } from '@strapi/plugin-upload';
import axios from 'axios';

export default {
  init(providerOptions) {
    const client = new UploadClient({ publicKey: providerOptions.public_key });
    const publicKey = providerOptions.public_key;
    const secretKey = providerOptions.secret_key;
    const baseCDN = providerOptions.base_cdn || 'https://ucarecdn.com';

    return {
      upload: (file, customConfig = {}) => {
        return new Promise((resolve, reject) => {
          client.uploadFile(file.buffer, { fileName: file.name, baseCDN: baseCDN })
              .then(image => {
                console.log(image.uuid);

                file.url = image.cdnUrl;
                file.provider_metadata = {
                  uuid: image.uuid,
                  original_filename: image.originalFilename,
                  image_info: image.imageInfo,
                };
                resolve();
              })
              .catch(err => {
                if (err.message.includes('File size too large')) {
                  return reject(errors.entityTooLarge());
                }
                return reject(errors.unknownError(`Error uploading to uploadcare: ${err.message}`));
              });
        });
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          const uuid = file.provider_metadata.uuid;
          if (uuid && secretKey) {
            axios.delete(`https://api.uploadcare.com/files/${uuid}/`, {
              headers: {
                'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`
              }
            })
                .then(() => {
                  resolve();
                })
                .catch(err => {
                  return reject(errors.unknownError(`Error deleting file: ${err.message}`));
                });
          } else {
            return reject(errors.unknownError('Error deleting file'));
          }
        });
      },
    };
  },
};
