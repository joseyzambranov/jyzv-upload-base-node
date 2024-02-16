const dotenv = require('dotenv');
const axios = require('axios');
const csvParser = require('csv-parser');

dotenv.config();

const URL_BASE_SINAPSIS_2 = process.env.URL_BASE_SINAPSIS_2;
const URL_BASE_AWS = process.env.URL_BASE_AWS;

const csvUrl = URL_BASE_AWS;

async function getUlrAws(){
    
}

function leerCsv(csvContent) {
    const parser = csvParser();
    const convertedRows = [];
  
    parser.on('data', (row) => {
      convertedRows.push({
        emailAddress: row.CORREO,
        unsubscribeAll: 'false',
      });
    });
  
    parser.write(csvContent);
  
    return convertedRows;
  }
  

  async function subirArchivo(data, csvFileToUpload) {
    const respUpload = await axios.post(data['url'], data['fields'], {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      files: csvFileToUpload,
    });
  
    return respUpload.status_code;
  }
  

  async function importarArchivo(importUrl, importBody, importHeaders) {
    const respImport = await axios.post(importUrl, JSON.stringify(importBody), {
      headers: importHeaders,
    });
  
    if (respImport.status_code === 200) {
      console.log('El key se ha cargado exitosamente en la otra URL.');
    } else {
      console.log('Error al cargar el key en la otra URL.');
    }
  }
  