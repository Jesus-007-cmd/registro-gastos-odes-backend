const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: 'us-east-2',
});

const BUCKET = 'registro-clientes-docs';
const KEY = 'control-gastos/catalogo-odes.json';

// ✅ Listar OdeS
router.get('/', async (req, res) => {
  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    const odes = JSON.parse(data.Body.toString('utf-8'));
    res.json({ odes });
  } catch (err) {
    res.json({ odes: [] });
  }
});

// ✅ Agregar nueva OdeS
router.post('/', express.json(), async (req, res) => {
  const nuevaOdeS = {
    id: 'ODES-' + uuidv4().slice(0, 6),
    ...req.body
  };

  try {
    let odes = [];
    try {
      const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
      odes = JSON.parse(data.Body.toString('utf-8'));
    } catch (err) {
      odes = [];
    }

    odes.push(nuevaOdeS);
    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(odes, null, 2))
    }).promise();

    res.json({ message: '✅ OdeS registrada', odeS: nuevaOdeS });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al guardar OdeS', details: err });
  }
});

// ✅ Editar OdeS
router.put('/:id', express.json(), async (req, res) => {
  const odeSId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let odes = JSON.parse(data.Body.toString('utf-8'));

    const index = odes.findIndex(o => o.id === odeSId);
    if (index === -1) return res.status(404).json({ error: 'OdeS no encontrada' });

    odes[index] = { ...odes[index], ...req.body };

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(odes, null, 2))
    }).promise();

    res.json({ message: '✅ OdeS actualizada', odeS: odes[index] });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al actualizar OdeS', details: err });
  }
});

// ✅ Eliminar OdeS
router.delete('/:id', async (req, res) => {
  const odeSId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let odes = JSON.parse(data.Body.toString('utf-8'));

    const nuevaLista = odes.filter(o => o.id !== odeSId);

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(nuevaLista, null, 2))
    }).promise();

    res.json({ message: '✅ OdeS eliminada' });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al eliminar OdeS', details: err });
  }
});

module.exports = router;
