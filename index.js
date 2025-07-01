require('dotenv').config();                         // ✅ Correcto: carga variables de entorno
const express = require('express');                 // ✅ Importa express
const cors = require('cors');                       // ✅ Habilita CORS
const app = express();                              // ✅ Inicializa express

app.use(cors());                                    // ✅ CORS activado
app.use(express.json());                            // ✅ Permite recibir JSON

// 👉 Rutas del sistema de control de gastos por OdeS
app.use('/gastos', require('./gastos/gastos'));     // ✅ Importa módulo de gastos correctamente

// 👉 Catálogos
app.use('/catalogo/bancos', require('./catalogos/bancos'));         // ✅
app.use('/catalogo/proveedores', require('./catalogos/proveedores'));// ✅
app.use('/catalogo/odes', require('./catalogos/odes'));             // ✅

// Puerto
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Backend de Control de Gastos escuchando en http://localhost:${port}`);
});
