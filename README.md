# 📘 Backend - Control de Gastos por OdeS

Sistema Node.js + Express que permite registrar y consultar:

✅ Gastos por orden de servicio (OdeS)  
✅ Catálogos de bancos, proveedores y órdenes de servicio  
✅ Almacenamiento de datos y archivos en **Amazon S3** sin usar base de datos  

---

## ⚙ Requisitos

- Node.js >= 14
- AWS S3 Bucket configurado
- Variables de entorno en un archivo `.env`:

```env
AWS_KEY=tu-access-key
AWS_SECRET=tu-secret-key
AWS_REGION=us-east-2
PORT=4000
```

---

## 🚀 Iniciar el servidor

```bash
npm install
node index.js
```

Servidor disponible en: `http://localhost:4000`

---

## 📂 Estructura de rutas

### 🏦 Bancos (`/bancos`)

| Método | Ruta             | Descripción              |
|--------|------------------|--------------------------|
| GET    | `/bancos`        | Listar todos los bancos  |
| POST   | `/bancos`        | Crear nuevo banco        |
| PUT    | `/bancos/:id`    | Editar banco existente   |
| DELETE | `/bancos/:id`    | Eliminar banco por ID    |

#### Ejemplo `POST`:

```json
{
  "nombre": "BBVA",
  "alias": "Tarjeta Corporativa",
  "clabe": "123456789012345678",
  "saldoInicial": 20000
}
```

---

### 📋 OdeS (`/odes`)

| Método | Ruta          | Descripción                |
|--------|---------------|----------------------------|
| GET    | `/odes`       | Listar todas las OdeS      |
| POST   | `/odes`       | Crear nueva OdeS           |
| PUT    | `/odes/:id`   | Editar OdeS                |
| DELETE | `/odes/:id`   | Eliminar OdeS              |

#### Ejemplo `POST`:

```json
{
  "nombre": "Mantenimiento Industrial",
  "cliente": "Empresa ABC",
  "montoCobrado": 14500
}
```

---

### 🧾 Proveedores (`/proveedores`)

| Método | Ruta                | Descripción                  |
|--------|---------------------|------------------------------|
| GET    | `/proveedores`      | Listar proveedores           |
| POST   | `/proveedores`      | Crear nuevo proveedor        |
| PUT    | `/proveedores/:id`  | Editar proveedor existente   |
| DELETE | `/proveedores/:id`  | Eliminar proveedor           |

#### Ejemplo `POST`:

```json
{
  "nombre": "Refaccionaria López",
  "rfc": "ROL920928JK1",
  "telefono": "6141234567",
  "tipo": "Refacciones"
}
```

---

### 💰 Gastos (`/gastos`)

| Método | Ruta              | Descripción                          |
|--------|-------------------|--------------------------------------|
| GET    | `/gastos`         | Listar todos los gastos              |
| GET    | `/gastos/:id`     | Obtener gastos por ID de OdeS       |
| POST   | `/gastos/upload`  | Subir gasto con archivos adjuntos    |

#### Subida `multipart/form-data`:

- Campos esperados:
  - `odeSId`
  - `proveedor`
  - `banco`
  - `cantidad`
  - `montoCobrado` (opcional)

- Archivos permitidos:
  - `factura`, `comprobante`, `evidencia` (opcionales)

---

## 🗃 Estructura en S3

```
registro-clientes-docs/
└── control-gastos/
    ├── catalogo-bancos.json
    ├── catalogo-odes.json
    ├── catalogo-proveedores.json
    ├── ODES001_datos.json
    ├── ODES001_factura_factura.pdf
    ├── ODES001_evidencia.jpg
    └── ...
```

---

## 📊 Cálculo de gasto en frontend

Para obtener el porcentaje de gasto respecto al monto cobrado:

```js
const porcentaje = (gasto.cantidad / gasto.montoCobrado) * 100;
```

También puedes agrupar por proveedor, banco o mes, usando filtros locales en los JSON.

---

## 🔐 Seguridad

✔ Todos los archivos subidos se almacenan en S3  
✔ Las rutas están protegidas si implementas CORS apropiadamente en `index.js`  
✔ Usa claves únicas por registro (`uuid`)

---


## 🚀 Despliegue en Railway

Este backend ha sido desplegado exitosamente en [Railway](https://railway.app/), una plataforma de infraestructura como servicio (PaaS).

**🔗 URL pública de producción:**

```
https://registro-gastos-odes-backend-production.up.railway.app/
```

**📂 Rama conectada:**

```
main
```

**🔧 Configuración clave:**

- Puerto expuesto: `8080` (`process.env.PORT || 8080`)
- Builder: `Nixpacks`
- Lenguaje: `Node.js`
- RAM: `1 GB` | vCPU: `2`
- Auto-deploy: activado al hacer push a `main`
- Networking: público y privado habilitados

**📄 Archivos involucrados:**

- `index.js` – Archivo principal donde se monta Express y las rutas.
- `.env` – Define variables de entorno como `PORT`, conexión a DB, etc.
- `package.json` – Contiene scripts, dependencias y `start` command.

**🛠 Pasos realizados para desplegar:**

1. Repositorio conectado desde GitHub: `Jesus-007-cmd/registro-gastos-odes-backend`
2. Rama `main` enlazada a producción.
3. Se configuró el puerto `8080` en el archivo `index.js`:
   ```js
   const PORT = process.env.PORT || 8080;
   app.listen(PORT, () => {
     console.log(`Escuchando en puerto ${PORT}`);
   });
   ```
4. Push desde terminal de VSCode:
   ```bash
   git add .
   git commit -m "set port 8080"
   git push origin main
   ```
5. Railway detectó el cambio y desplegó automáticamente.
6. Verificado el endpoint funcionando: `https://registro-gastos-odes-backend-production.up.railway.app/gastos` devuelve:
   ```json
   {"gastos":[]}
   ```



## ✍ Autor

Desarrollado por **Jesús Antonio Gutiérrez** para sistemas internos empresariales.


