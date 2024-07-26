"use strict";

/**
 * Module dependencies
 */

    // Public node modules.
const uploadcare = require('@uploadcare/upload-client');
const axios = require('axios').default;

module.exports = {
    init(providerOptions) {
        const client = new uploadcare.UploadClient({publicKey: providerOptions.public_key});
        const publicKey = providerOptions.public_key;
        const secretKey = providerOptions.secret_key;
        const baseCDN = providerOptions.base_cdn || 'https://ucarecdn.com';

        return {
            upload: (file, customConfig = {}) => {
                return new Promise((resolve, reject) => {
                    client
                        .uploadFile(file.buffer, {fileName: file.name, baseCDN: baseCDN,})
                        .then(image => {
                            console.log(image.uuid);

                            // file.previewUrl = image.cdnUrl;
                            file.url = image.cdnUrl;

                            file.provider_metadata = {
                                uuid: image.uuid,
                                original_filename: image.originalFilename,
                                image_info: image.imageInfo,
                            };
                            resolve();
                        }, (err) => {
                            if (err) {
                                return reject(err.message);
                            }
                        })
                });
            }, delete: (file) => {
                return new Promise((resolve, reject) => {
                    const uuid = file.provider_metadata.uuid;
                    if (uuid && secretKey) {
                        return axios.delete(`https://api.uploadcare.com/files/${uuid}/`, {
                            headers: {
                                'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`
                            }
                        }).catch((err) => {
                            return reject(err.message);
                        }).then(() => {
                            resolve();
                        });
                    } else {
                        return reject(err.message);
                    }
                });
            },
        };
    },
};
