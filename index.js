const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');
const FormData = require('form-data');

require('dotenv').config();

const URL_BASE = process.env.URL_BASE_SINAPSIS_2;
const csvUrl = process.env.URL_BASE_AWS;

axios.get(csvUrl)
  .then(async response => {
    if (response.status === 200) {
      const rows = [];
      const csvContent = response.data;
      
      const csvStream = Readable.from(csvContent);
      const csvParsed = csvStream.pipe(csv());

      for await (const row of csvParsed) {
        rows.push({
          emailAddress: row.CORREO,
          unsubscribeAll: "false"
        });
      }
      console.log(csvContent)
      const respGenerate = await axios.get(`${URL_BASE}/contactList/default/generate-signed-upload`);
      const data = respGenerate.data;
      //const formData = new FormData();
      //formData.append('file', csvContent, { filename: 'base2.csv' });
      //
      //Object.keys(data.fields).forEach(key => {
      //  formData.append(key, data.fields[key]);
      //});
      //
      //const respUpload = await axios.post(data.url, formData, {
      //  headers: {
      //    ...formData.getHeaders(),
      //  },
      //});
      //console.log(respUpload.status);
    } else {
      console.log("Error al descargar el archivo CSV desde la URL.");
    }
  })
  .catch(error => {
    console.error("Ocurrió un error:", error);
  });
