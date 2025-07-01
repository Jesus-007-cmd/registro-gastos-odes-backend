require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Importar rutas
const gastosRoutes = require('./gastos/gastos');
const bancosRoutes = require('./catalogos/bancos');
const odesRoutes = require('./catalogos/odes');
const proveedoresRoutes = require('./catalogos/proveedores');

// Montar rutas
app.use('/gastos', gastosRoutes);            // POST /gastos/upload, GET /gastos, GET /gastos/:id
app.use('/bancos', bancosRoutes);            // CRUD bancos
app.use('/odes', odesRoutes);                // CRUD OdeS
app.use('/proveedores', proveedoresRoutes);  // CRUD proveedores

// Puerto
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Escuchando en puerto ${PORT}`);
});
