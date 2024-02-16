const dotenv = require('dotenv');
const axios = require('axios');
const csvParser = require('csv-parser');

dotenv.config();

const URL_BASE_SINAPSIS_2 = process.env.URL_BASE_SINAPSIS_2;
const URL_BASE_AWS = process.env.URL_BASE_AWS;

const csvUrl = URL_BASE_AWS;

(async () => {
  try {
    const response = await axios.get(csvUrl);
    console.log(response.status)
    console.log(response.data)
    if (response.status === 200) {
      const csvContent = response.data.toString('utf-8');

      const convertedRows = [];
      const parser = csvParser();

      parser.on('data', (row) => {
        convertedRows.push({
          emailAddress: row.CORREO,
          unsubscribeAll: 'false',
        });
      });

      await new Promise((resolve) => parser.on('end', resolve));

      console.log(convertedRows)
      // **Solución 1: analizar directamente la cadena CSV**
      parser.write(csvContent);

      const respGenerate = await axios.get(`${URL_BASE_SINAPSIS_2}/contactList/default/generate-signed-upload`);
      console.log(respGenerate.status);
      const data = respGenerate.data;
      
     return
      data['fields']['content-type'] = 'text/plain';
      const csvOutput = fs.createWriteStream('base2.csv');
      const csvWriter = csv.DictWriter(csvOutput, {
        fieldnames: ['emailAddress', 'unsubscribeAll'],
      });

      csvWriter.writeHeader();
      csvWriter.writeRecords(convertedRows);
      csvWriter.end();

      const csvFileToUpload = {
        file: fs.createReadStream('base2.csv'),
      };

      const respUpload = await axios.post(data['url'], data['fields'], {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        files: csvFileToUpload,
      });

      if (respUpload.status_code === 200 || respUpload.status_code === 204) {
        const importUrl = `${URL_BASE_SINAPSIS_2}/contactList/default/import-job`;
        const importBody = {
          s3Key: data['fields']['key'],
        };
        const importHeaders = {
          'Content-Type': 'application/json',
        };

        const respImport = await axios.post(importUrl, JSON.stringify(importBody), {
          headers: importHeaders,
        });

        if (respImport.status_code === 200) {
          console.log('El key se ha cargado exitosamente en la otra URL.');
        } else {
          console.log('Error al cargar el key en la otra URL.');
        }
      } else {
        console.log('Error al subir el archivo CSV a la otra URL.');
      }
    } else {
      console.log('Error al descargar el archivo CSV desde la URL.');
    }
  } catch (error) {
    console.error('Error general:', error.message);
  }
})();
