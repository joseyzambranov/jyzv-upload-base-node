const axios = require('axios');
const fs = require('fs');
const { Readable } = require('stream');
const dotenv = require('dotenv');
const FormData = require('form-data');
const aws4 = require('aws4');
const { createObjectCsvWriter } = require('csv-writer');
const csvParser = require('csv-parser');

dotenv.config();

const URL_BASE = process.env.URL_BASE_SINAPSIS_2;
const URL_BASE_AWS = process.env.URL_BASE_AWS;

const csvUrl = URL_BASE_AWS;

async function fetchData() {
    try {
        const response = await axios.get(csvUrl);
        if (response.status === 200) {
            const csvContent = response.data;

            const convertedRows = [];
            await new Promise((resolve, reject) => {
                Readable.from(csvContent)
                    .pipe(csvParser())
                    .on('data', row => {
                        const convertedRow = {
                            emailAddress: row['CORREO'],
                            unsubscribeAll: 'false'
                        };
                        convertedRows.push(convertedRow);
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            const uploadResponse = await axios.get(`${URL_BASE}/contactList/default/generate-signed-upload`);
            const uploadData = uploadResponse.data;
            uploadData.fields['content-type'] = 'text/plain';
            
            // Escribir el CSV convertido en un stream
            const csvWriter = createObjectCsvWriter({
                path: 'base2.csv',
                header: [
                    { id: 'emailAddress', title: 'emailAddress' },
                    { id: 'unsubscribeAll', title: 'unsubscribeAll' }
                ]
            });
            await csvWriter.writeRecords(convertedRows);
            
            const formData = new FormData();
            //for (const key in uploadData.fields) {
            //    formData.append(key, uploadData.fields[key]);
            //}
            formData.append('file', fs.createReadStream('base2.csv'));
            
            const config = {
                method: "post",
                url: uploadData.url,
                data: formData,
                headers: formData.getHeaders(),
            };
            const uploadUploadResponse = await axios(config);
            
            console.log(uploadUploadResponse);
            if (uploadUploadResponse.status === 200 || uploadUploadResponse.status === 204) {
                const importUrl = `${URL_BASE}/contactList/default/import-job`;
                const importBody = {
                    s3Key: uploadData.fields.key
                };

                const importResponse = await axios.post(importUrl, importBody);

                if (importResponse.status === 200) {
                    console.log("El key se ha cargado exitosamente en la otra URL.");
                } else {
                    console.log("Error al cargar el key en la otra URL.");
                }
            } else {
                console.log("Error al subir el archivo CSV.");
            }
        } else {
            console.log("Error al descargar el archivo CSV desde la URL.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchData();
