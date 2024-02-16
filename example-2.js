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
            console.log(csvOutput)
            const csvFile = createCsvStream(csvOutput);
            const formData = new FormData();
            formData.append('file', Buffer.from([csvFile]), 'base2.csv');
            //formData.append('file', csvFile, 'base2.csv');

        //    formData.getLength((err, contentLength) => {
        //        console.log(contentLength)
        //        if (err) {
        //          console.error('Error al calcular la longitud del contenido:', err);
        //          return;
        //        }
//
//
        //})
            
            for (const key in uploadData.fields) {
                formData.append(key, uploadData.fields[key]);
                console.log("valor" + uploadData.fields[key])
                console.log("key" + key)
              }

            //const uploadOptions = {
            //    headers: {
            //        ...formData.getHeaders(),
            //        ...uploadData.fields
            //    }
            //};
            //console.log(formData.getHeaders())
            
            //console.log(formData)
            //const signedRequest = aws4.sign({
            //    ...uploadData,
            //    //body: formData,
            //    headers: {
            //        //...formData.getHeaders(),
            //        ...uploadData.fields
            //    }
            //});

            //console.log(signedRequest)
            //return
            console.log("Headers:");
           // console.log(uploadOptions.headers);
    
            console.log("URL:");
            console.log(uploadData.url);

            //const uploadUploadResponse = await axios(uploadData.url, formData);
            formData.forEach((valor, clave) => {
                console.log(`${clave}: ${valor}`);
              });
              return
            const uploadUploadResponse = await axios.post(uploadData.url, formData, {headers:{

                ...formData.getHeaders(),

            }});
            console.log("Upload Response:");
            console.log(uploadUploadResponse.data);
            return
            if (uploadUploadResponse.status === 200 || uploadUploadResponse.status === 204) {
                const importUrl = `${URL_BASE}/contactList/default/import-job`;
                const importBody = {
                    s3Key: uploadData.fields.key
                };

                const importHeaders = {
                    'Content-Type': 'application/json'
                };

                const importResponse = await axios.post(importUrl, importBody, { headers: importHeaders });

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

//function parseCsv(csvContent) {
//    const rows = csvContent.split('\n');
//    const headers = rows[0].split(',');
//    const convertedRows = [];
//
//    for (let i = 1; i < rows.length; i++) {
//        const values = rows[i].split(',');
//        const convertedRow = {};
//        for (let j = 0; j < headers.length; j++) {
//            convertedRow[headers[j]] = values[j];
//        }
//        convertedRows.push(convertedRow);
//    }
//
//    return convertedRows;
//}

//function generateCsv(rows) {
//    console.log(rows)
//    let csv = 'emailAddress,unsubscribeAll\n';
//    for (const row of rows) {
//        console.log(row)
//        csv += `${row.CORREO},false\n`;
//    }
//    return csv;
//}
//function generateCsv(csvContent) {
//    const rows = csvContent.split('\n');
//    let csv = 'emailAddress,unsubscribeAll\n';
//    
//    for (let i = 1; i < rows.length; i++) {
//        const values = rows[i].split(',');
//        if (values.length > 0) {
//            const emailAddress = values[0]; // Assuming email is in the first column
//            csv += `${emailAddress},false\n`;
//        }
//    }
//    return csv;
//}

//function generateCsv(csvContent) {
//    const rows = csvContent.split(/\r?\n/); // Modificación aquí
//    let csv = 'emailAddress,unsubscribeAll\n';
//    
//    for (let i = 1; i < rows.length; i++) {
//        const values = rows[i].split(',');
//        if (values.length > 0) {
//            const emailAddress = values[0].trim(); // Trim para eliminar espacios en blanco alrededor del correo electrónico
//            csv += `${emailAddress},false\n`;
//        }
//    }
//    return csv;
//}


//function generateCsv(csvContent) {
//    const rows = csvContent.split(/\r?\n/);
//    let csv = 'emailAddress,unsubscribeAll\n';
//    let columnIndex = -1;
//
//    const headers = rows[0].split(',');
//    for (let i = 0; i < headers.length; i++) {
//        if (headers[i].trim().toUpperCase() === 'CORREO') {
//            columnIndex = i;
//            break;
//        }
//    }
//
//    if (columnIndex !== -1) {
//        for (let i = 1; i < rows.length; i++) {
//            const values = rows[i].split(',');
//            if (values.length > columnIndex) {
//                const emailAddress = values[columnIndex].trim();
//                csv += `${emailAddress},false\n`;
//            }
//        }
//    } else {
//        console.log("No se encontró la columna 'CORREO' en el CSV.");
//    }
//
//    return csv;
//}

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

fetchData();
