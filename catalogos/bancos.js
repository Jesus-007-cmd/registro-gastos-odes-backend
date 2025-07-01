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
const KEY = 'control-gastos/catalogo-bancos.json';

// ✅ Listar bancos
router.get('/', async (req, res) => {
  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    const bancos = JSON.parse(data.Body.toString('utf-8'));
    res.json({ bancos });
  } catch (err) {
    res.json({ bancos: [] });
  }
});

// ✅ Agregar banco
router.post('/', express.json(), async (req, res) => {
  const nuevoBanco = {
    id: 'BAN-' + uuidv4().slice(0, 6),
    ...req.body
  };

  try {
    let bancos = [];
    try {
      const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
      bancos = JSON.parse(data.Body.toString('utf-8'));
    } catch (err) {
      bancos = [];
    }

    bancos.push(nuevoBanco);
    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(bancos, null, 2))
    }).promise();

    res.json({ message: '✅ Banco registrado', banco: nuevoBanco });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al guardar banco', details: err });
  }
});

// ✅ Editar banco
router.put('/:id', express.json(), async (req, res) => {
  const bancoId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let bancos = JSON.parse(data.Body.toString('utf-8'));

    const index = bancos.findIndex(b => b.id === bancoId);
    if (index === -1) return res.status(404).json({ error: 'Banco no encontrado' });

    bancos[index] = { ...bancos[index], ...req.body };

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(bancos, null, 2))
    }).promise();

    res.json({ message: '✅ Banco actualizado', banco: bancos[index] });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al actualizar banco', details: err });
  }
});

// ✅ Eliminar banco
router.delete('/:id', async (req, res) => {
  const bancoId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let bancos = JSON.parse(data.Body.toString('utf-8'));

    const nuevaLista = bancos.filter(b => b.id !== bancoId);

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(nuevaLista, null, 2))
    }).promise();

    res.json({ message: '✅ Banco eliminado' });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al eliminar banco', details: err });
  }
});

module.exports = router;
