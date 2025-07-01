require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();

app.use(cors());

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: 'us-east-2',
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/gastos/upload', upload.fields([
  { name: 'factura' },
  { name: 'comprobante' },
  { name: 'evidencia' }
]), async (req, res) => {
  try {
    const formData = req.body;
    const odeSId = formData.odeSId || 'sin_odeS';
    
    const jsonBuffer = Buffer.from(JSON.stringify(formData, null, 2));
    const jsonParams = {
      Bucket: 'registro-clientes-docs',
      Key: `control-gastos/${odeSId}_datos.json`,
      Body: jsonBuffer,
      ContentType: 'application/json',
    };
    await s3.upload(jsonParams).promise();

    const fileFields = req.files;
    for (const [fieldName, files] of Object.entries(fileFields)) {
      for (const file of files) {
        const fileParams = {
          Bucket: 'registro-clientes-docs',
          Key: `control-gastos/${odeSId}_${fieldName}_${file.originalname}`,
          Body: file.buffer,
        };
        await s3.upload(fileParams).promise();
      }
    }

    res.json({ message: '✅ Gasto y archivos subidos correctamente a S3' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Error al subir datos/archivos', details: err });
  }
});

//Lectura del archivo .json de una OdeS:
app.get('/gastos/:id', async (req, res) => {
  const odeSId = req.params.id;

  try {
    const data = await s3.getObject({
      Bucket: 'registro-clientes-docs',
      Key: `control-gastos/${odeSId}_datos.json`,
    }).promise();

    const jsonContent = JSON.parse(data.Body.toString('utf-8'));
    res.json(jsonContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Error al leer el gasto', details: err });
  }
});


//. 📋 Listar todos los gastos registrados
app.get('/gastos', async (req, res) => {
  try {
    const data = await s3.listObjectsV2({
      Bucket: 'registro-clientes-docs',
      Prefix: 'control-gastos/',
    }).promise();

    const jsonFiles = data.Contents.filter(item => item.Key.endsWith('_datos.json'));

    const gastos = [];

    for (const file of jsonFiles) {
      const obj = await s3.getObject({
        Bucket: 'registro-clientes-docs',
        Key: file.Key,
      }).promise();
      gastos.push(JSON.parse(obj.Body.toString('utf-8')));
    }

    res.json({ gastos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Error al listar los gastos', details: err });
  }
});

app.listen(4000, () => console.log('🚀 Backend escuchando en http://localhost:4000'));
