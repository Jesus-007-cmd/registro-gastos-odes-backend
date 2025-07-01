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
const KEY = 'control-gastos/catalogo-proveedores.json';

// ✅ Listar proveedores
router.get('/', async (req, res) => {
  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    const proveedores = JSON.parse(data.Body.toString('utf-8'));
    res.json({ proveedores });
  } catch (err) {
    res.json({ proveedores: [] });
  }
});

// ✅ Agregar proveedor
router.post('/', express.json(), async (req, res) => {
  const nuevoProveedor = {
    id: 'PROV-' + uuidv4().slice(0, 6),
    ...req.body
  };

  try {
    let proveedores = [];
    try {
      const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
      proveedores = JSON.parse(data.Body.toString('utf-8'));
    } catch (err) {
      proveedores = [];
    }

    proveedores.push(nuevoProveedor);
    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(proveedores, null, 2))
    }).promise();

    res.json({ message: '✅ Proveedor registrado', proveedor: nuevoProveedor });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al guardar proveedor', details: err });
  }
});

// ✅ Editar proveedor
router.put('/:id', express.json(), async (req, res) => {
  const proveedorId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let proveedores = JSON.parse(data.Body.toString('utf-8'));

    const index = proveedores.findIndex(p => p.id === proveedorId);
    if (index === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });

    proveedores[index] = { ...proveedores[index], ...req.body };

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(proveedores, null, 2))
    }).promise();

    res.json({ message: '✅ Proveedor actualizado', proveedor: proveedores[index] });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al actualizar proveedor', details: err });
  }
});

// ✅ Eliminar proveedor
router.delete('/:id', async (req, res) => {
  const proveedorId = req.params.id;

  try {
    const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
    let proveedores = JSON.parse(data.Body.toString('utf-8'));

    const nuevaLista = proveedores.filter(p => p.id !== proveedorId);

    await s3.putObject({
      Bucket: BUCKET,
      Key: KEY,
      Body: Buffer.from(JSON.stringify(nuevaLista, null, 2))
    }).promise();

    res.json({ message: '✅ Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ error: '❌ Error al eliminar proveedor', details: err });
  }
});

module.exports = router;
