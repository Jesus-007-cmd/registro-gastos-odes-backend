// gastos/gastos.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');

const router = express.Router();
router.use(cors());

// ——— Configuración de S3 ———
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: 'us-east-2',
});

// ——— Multer en memoria ———
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📤 Subir gasto (datos + archivos) a S3
router.post(
  '/upload',
  upload.fields([
    { name: 'factura',    maxCount: 1 },
    { name: 'comprobante', maxCount: 1 },
    { name: 'evidencia',   maxCount: 1 }
  ]),
  async (req, res) => {
    // ——— LOGS DE DEPURACIÓN ———
    console.log('➡️  POST /gastos/upload');
    console.log('Campos recibidos en req.body:', req.body);
    console.log('Archivos recibidos en req.files:', req.files);
    // ————————————————

    try {
      const formData = req.body;
      const odeSId = formData.odeSId || 'sin_odeS';

      // 1) Guardar JSON con los datos del formulario
      const jsonBuffer = Buffer.from(JSON.stringify(formData, null, 2));
      await s3.upload({
        Bucket: 'registro-clientes-docs',
        Key: `control-gastos/${odeSId}_datos.json`,
        Body: jsonBuffer,
        ContentType: 'application/json',
      }).promise();

      // 2) Guardar cada archivo (factura, comprobante, evidencia)
      for (const [fieldName, files] of Object.entries(req.files)) {
        for (const file of files) {
          await s3.upload({
            Bucket: 'registro-clientes-docs',
            Key: `control-gastos/${odeSId}_${fieldName}_${file.originalname}`,
            Body: file.buffer,
          }).promise();
        }
      }

      return res.json({ message: '✅ Gasto y archivos subidos correctamente a S3' });
    } catch (err) {
      console.error('❌ Error en POST /gastos/upload:', err);
      return res.status(500).json({ error: 'Error al subir datos/archivos', details: err.message });
    }
  }
);

// 📄 Leer gasto individual
router.get('/:id', async (req, res) => {
  try {
    const data = await s3.getObject({
      Bucket: 'registro-clientes-docs',
      Key: `control-gastos/${req.params.id}_datos.json`,
    }).promise();

    return res.json(JSON.parse(data.Body.toString('utf-8')));
  } catch (err) {
    console.error('❌ Error en GET /gastos/:id:', err);
    return res.status(500).json({ error: 'Error al leer el gasto', details: err.message });
  }
});

// 📋 Listar todos los gastos
router.get('/', async (req, res) => {
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

    return res.json({ gastos });
  } catch (err) {
    console.error('❌ Error en GET /gastos:', err);
    return res.status(500).json({ error: 'Error al listar los gastos', details: err.message });
  }
});
// gastos/gastos.js
// ——— después de los imports, Multer y tus rutas actuales ———

// 1) Listar los archivos de un gasto concreto (sin incluir el JSON de datos)
router.get('/:id/files', async (req, res) => {
  const { id } = req.params;
  try {
    const list = await s3.listObjectsV2({
      Bucket: 'registro-clientes-docs',
      Prefix: `control-gastos/${id}_`
    }).promise();

    // Filtramos el JSON de datos y devolvemos sólo los nombres de archivo
    const files = (list.Contents||[])
      .map(obj => obj.Key!.split('/').pop()!)
      .filter(name => !name.endsWith('_datos.json'));

    res.json({ files });
  } catch (err) {
    console.error('Error listando archivos:', err);
    res.status(500).json({ error: 'Error listando archivos', details: err.message });
  }
});

// 2) Generar URL pre-firmada para descargar un archivo
router.get('/download/:id/:fileName', async (req, res) => {
  const { id, fileName } = req.params;
  const key = `control-gastos/${id}_${fileName}`;
  try {
    const url = s3.getSignedUrl('getObject', {
      Bucket: 'registro-clientes-docs',
      Key: key,
      Expires: 60 * 5, // válida 5 minutos
    });
    res.json({ url });
  } catch (err) {
    console.error('Error generando URL de descarga:', err);
    res.status(500).json({ error: 'Error generando URL de descarga', details: err.message });
  }
});

module.exports = router;

module.exports = router;
