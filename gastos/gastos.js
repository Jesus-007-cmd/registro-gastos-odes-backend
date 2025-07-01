// gastos/gastos.js
require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const AWS      = require('aws-sdk');
const cors     = require('cors');

const router = express.Router();
router.use(cors());

// ——— Configuración de S3 ———
const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region:          'us-east-2',
});

// ——— Multer en memoria ———
const upload = multer({ storage: multer.memoryStorage() });

// 📤 Subir gasto (datos + archivos) a S3
router.post(
  '/upload',
  upload.fields([
    { name: 'factura',    maxCount: 1 },
    { name: 'comprobante', maxCount: 1 },
    { name: 'evidencia',   maxCount: 1 }
  ]),
  async (req, res) => {
    console.log('➡️  POST /gastos/upload');
    console.log('Campos recibidos en req.body:', req.body);
    console.log('Archivos recibidos en req.files:', req.files);

    try {
      const formData = req.body;
      const odeSId    = formData.odeSId || 'sin_odeS';

      // 1) Guardar JSON con los datos del formulario
      const jsonBuffer = Buffer.from(JSON.stringify(formData, null, 2));
      await s3.upload({
        Bucket: 'registro-clientes-docs',
        Key:    `control-gastos/${odeSId}_datos.json`,
        Body:   jsonBuffer,
        ContentType: 'application/json',
      }).promise();

      // 2) Guardar cada archivo (factura, comprobante, evidencia)
      const filesObj = req.files || {};
      for (const fieldName of Object.keys(filesObj)) {
        const files = filesObj[fieldName] || [];
        for (const file of files) {
          await s3.upload({
            Bucket: 'registro-clientes-docs',
            Key:    `control-gastos/${odeSId}_${fieldName}_${file.originalname}`,
            Body:   file.buffer,
          }).promise();
        }
      }

      res.json({ message: '✅ Gasto y archivos subidos correctamente a S3' });
    } catch (err) {
      console.error('❌ Error en POST /gastos/upload:', err);
      res.status(500).json({ error: 'Error al subir datos/archivos', details: err.message });
    }
  }
);

// 📄 Leer gasto individual
router.get('/:id', async (req, res) => {
  try {
    const key = `control-gastos/${req.params.id}_datos.json`;
    const data = await s3.getObject({ Bucket: 'registro-clientes-docs', Key: key }).promise();
    const json = data.Body ? JSON.parse(data.Body.toString('utf-8')) : {};
    res.json(json);
  } catch (err) {
    console.error('❌ Error en GET /gastos/:id:', err);
    res.status(500).json({ error: 'Error al leer el gasto', details: err.message });
  }
});

// 📋 Listar todos los gastos (solo datos)
router.get('/', async (req, res) => {
  try {
    const list = await s3.listObjectsV2({
      Bucket: 'registro-clientes-docs',
      Prefix: 'control-gastos/',
    }).promise();

    const contents = list.Contents || [];
    const jsonFiles = contents.filter(item => item.Key && item.Key.endsWith('_datos.json'));
    const gastos = [];

    for (const file of jsonFiles) {
      const data = await s3.getObject({ Bucket: 'registro-clientes-docs', Key: file.Key }).promise();
      if (data.Body) {
        gastos.push(JSON.parse(data.Body.toString('utf-8')));
      }
    }

    res.json({ gastos });
  } catch (err) {
    console.error('❌ Error en GET /gastos:', err);
    res.status(500).json({ error: 'Error al listar los gastos', details: err.message });
  }
});

// 📁 Listar los archivos de un gasto concreto
router.get('/:id/files', async (req, res) => {
  const { id } = req.params;
  try {
    const list = await s3.listObjectsV2({
      Bucket: 'registro-clientes-docs',
      Prefix: `control-gastos/${id}_`
    }).promise();

    const contents = list.Contents || [];
    const files = contents
      .map(obj => {
        if (!obj.Key) return null;
        const parts = obj.Key.split('/');
        const name  = parts.length ? parts[parts.length - 1] : null;
        return name;
      })
      .filter(name => name && !name.endsWith('_datos.json'));

    res.json({ files });
  } catch (err) {
    console.error('❌ Error listando archivos:', err);
    res.status(500).json({ error: 'Error listando archivos', details: err.message });
  }
});

// 📥 Generar URL pre-firmada para descargar un archivo
router.get('/download/:id/:fileName', async (req, res) => {
  const { id, fileName } = req.params;
  const key = `control-gastos/${id}_${fileName}`;
  try {
    const url = s3.getSignedUrl('getObject', {
      Bucket: 'registro-clientes-docs',
      Key:    key,
      Expires: 300, // 5 minutos
    });
    res.json({ url });
  } catch (err) {
    console.error('❌ Error generando URL de descarga:', err);
    res.status(500).json({ error: 'Error generando URL de descarga', details: err.message });
  }
});

// 📦 Listar gastos completos (datos + archivos)
// Al final de gastos/gastos.js, antes de module.exports

/**
 * GET /gastos/full
 * Devuelve array de { datos: { odeSId,… }, files: [<nombres>] }
 */
router.get('/full', async (req, res) => {
  try {
    // 1) Lista todos los objetos en S3 con prefijo control-gastos/
    const list = await s3.listObjectsV2({
      Bucket: 'registro-clientes-docs',
      Prefix: 'control-gastos/',
    }).promise();
    const contents = list.Contents || [];

    // 2) Filtra solo los JSON de datos
    const jsonFiles = contents.filter(item =>
      item.Key && item.Key.endsWith('_datos.json')
    );

    const resultados = [];

    // 3) Para cada JSON de datos:
    for (const jf of jsonFiles) {
      const keyDatos = jf.Key;
      if (!keyDatos) continue;

      // extrae el odeSId de "control-gastos/{odeSId}_datos.json"
      const parts = keyDatos.split('/');
      const fileName = parts[parts.length - 1];           // "{odeSId}_datos.json"
      const odeSId = fileName.replace('_datos.json', ''); // "123"

      // descarga y parsea el JSON
      const objData = await s3.getObject({
        Bucket: 'registro-clientes-docs',
        Key: keyDatos,
      }).promise();
      const datos = objData.Body
        ? JSON.parse(objData.Body.toString('utf-8'))
        : {};

      // lista todos los archivos que empiecen con ese ID
      const filesList = contents
        .filter(o => 
          o.Key &&
          o.Key.startsWith(`control-gastos/${odeSId}_`) &&
          !o.Key.endsWith('_datos.json')
        )
        .map(o => {
          // coge solo la parte tras la última '/'
          const segs = o.Key.split('/');
          return segs[segs.length - 1];
        });

      resultados.push({ datos, files: filesList });
    }

    return res.json({ gastos: resultados });
  } catch (err) {
    console.error('❌ Error en GET /gastos/full:', err);
    return res.status(500).json({
      error: 'Error al listar gastos completos',
      details: err.message || err
    });
  }
});

module.exports = router;
