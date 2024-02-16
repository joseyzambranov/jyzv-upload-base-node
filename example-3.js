const axios = require('axios');
const fs = require('fs');
const { Readable } = require('stream');
const dotenv = require('dotenv');
const FormData = require('form-data');
const aws4 = require('aws4');

dotenv.config();

const URL_BASE = process.env.URL_BASE_SINAPSIS_2;
const URL_BASE_AWS = process.env.URL_BASE_AWS;

const csvUrl = URL_BASE_AWS;

async function fetchData() {
    try {
        const response = await axios.get(csvUrl);
        if (response.status === 200) {
            const csvContent = response.data;
            const uploadResponse = await axios.get(`${URL_BASE}/contactList/default/generate-signed-upload`);
            const uploadData = uploadResponse.data;
            uploadData.fields['content-type'] = 'text/plain';
            const csvOutput = generateCsv(csvContent);
            const csvFile = createCsvStream(csvOutput);
            console.log(csvFile)
            const formData = new FormData();
            for (const key in uploadData.fields) {
                formData.append(key, uploadData.fields[key]);
              }
              formData.append('file',csvFile, 'base2.csv');
              
             let contentLength =  csvFile.readableLength
             
             console.log(contentLength)
             //return
          let config = {
            method: "post",
            url: uploadData.url,
            data: formData,
            headers: { "Content-Type": "multipart/form-data","Content-Length": `${contentLength}` },
          }
          const uploadUploadResponse = await axios(config)

            console.log(uploadUploadResponse);

        } else {
            console.log("Error al descargar el archivo CSV desde la URL.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}


function generateCsv(csvContent) {
    const rows = csvContent.split(/\r?\n/); // Dividir por líneas
    let csv = 'emailAddress,unsubscribeAll\n';
    let columnIndex = -1;

    // Buscar la columna que tiene el encabezado "CORREO"
    const headers = rows[0].split(',');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].trim().toUpperCase() === 'CORREO') {
            columnIndex = i;
            break;
        }
    }

    // Si se encontró la columna "CORREO", procesar los correos electrónicos
    if (columnIndex !== -1) {
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length > columnIndex) {
                const emailAddress = values[columnIndex].trim(); // Trim para eliminar espacios en blanco alrededor del correo electrónico
                csv += `${emailAddress},false\n`;
            }
        }
    } else {
        console.log("No se encontró la columna 'CORREO' en el CSV.");
    }

    // Eliminar la última coma si el CSV termina con una línea vacía
    if (csv.endsWith(',false\n')) {
        csv = csv.slice(0, -7) + '\n';
    }

    return csv;
}


function createCsvStream(csvContent) {
    const stream = new Readable();
    stream.push(csvContent);
    stream.push(null);
    return stream;
}

function getContentLength(stream) {
    return new Promise((resolve, reject) => {
        let length = 0;
        stream.on('data', (chunk) => {
            length += chunk.length;
        });
        stream.on('end', () => {
            resolve(length);
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}


fetchData();
