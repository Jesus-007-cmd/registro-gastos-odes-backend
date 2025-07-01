# 📦 Backend - Registro de Clientes 2025

Este backend en Node.js + Express permite:
✅ Subir datos y archivos de clientes a un bucket S3  
✅ Generar identificadores únicos por registro (UUID)  
✅ Agrupar registros y archivos para consulta  
✅ Generar links temporales (signed URLs) para descarga segura  

---

## 🚀 Requisitos

- Node.js >= 14
- Cuenta AWS con S3 configurado
- Claves AWS con permisos para:
  - `s3:PutObject`
  - `s3:GetObject`
  - `s3:ListBucket`

---

## 📁 Estructura de archivos en S3

Cada registro se guarda así:

```
# 📘 Control de Gastos por OdeS – Backend

Sistema para registrar y consultar **gastos por orden de servicio (OdeS)**, catálogos de bancos, proveedores y OdeS. Toda la información se guarda en **Amazon S3** en formato `.json`, sin usar base de datos.

---

## 📦 Requisitos

- Node.js
- AWS Bucket configurado
- Variables de entorno `.env`:

```
AWS_KEY=TU_ACCESS_KEY
AWS_SECRET=TU_SECRET_KEY
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

## 📂 Rutas disponibles

### 🏦 Bancos (`/catalogo/bancos`)

| Método | Ruta                    | Descripción              |
|--------|-------------------------|--------------------------|
| GET    | `/catalogo/bancos`      | Obtener todos los bancos |
| POST   | `/catalogo/bancos`      | Crear un banco nuevo     |
| PUT    | `/catalogo/bancos/:id`  | Editar un banco existente|
| DELETE | `/catalogo/bancos/:id`  | Eliminar banco por ID    |

#### 📤 Ejemplo `POST`:

```json
{
  "nombre": "BBVA",
  "alias": "Tarjeta Corporativa",
  "clabe": "123456789012345678",
  "saldoInicial": 20000
}
```

---

### 🧾 Proveedores (`/catalogo/proveedores`)

| Método | Ruta                          | Descripción                  |
|--------|-------------------------------|------------------------------|
| GET    | `/catalogo/proveedores`       | Listar todos los proveedores|
| POST   | `/catalogo/proveedores`       | Registrar proveedor nuevo   |
| PUT    | `/catalogo/proveedores/:id`   | Editar proveedor             |
| DELETE | `/catalogo/proveedores/:id`   | Eliminar proveedor           |

#### 📤 Ejemplo `POST`:

```json
{
  "nombre": "Refaccionaria López",
  "rfc": "ROL920928JK1",
  "telefono": "6141234567",
  "tipo": "Refacciones"
}
```

---

### 📋 Órdenes de Servicio (`/catalogo/odes`)

| Método | Ruta                    | Descripción                        |
|--------|-------------------------|------------------------------------|
| GET    | `/catalogo/odes`        | Listar todas las OdeS              |
| POST   | `/catalogo/odes`        | Registrar OdeS nueva               |
| PUT    | `/catalogo/odes/:id`    | Editar OdeS                        |
| DELETE | `/catalogo/odes/:id`    | Eliminar OdeS                      |

#### 📤 Ejemplo `POST`:

```json
{
  "nombre": "Mantenimiento industrial",
  "cliente": "Empresa ABC",
  "montoCobrado": 14500
}
```

---

### 💰 Gastos (`/gastos`)

| Método | Ruta                 | Descripción                                |
|--------|----------------------|--------------------------------------------|
| GET    | `/gastos`            | Listar todos los gastos (datos JSON)       |
| GET    | `/gastos/:id`        | Obtener un gasto por ID de OdeS            |
| POST   | `/gastos/upload`     | Subir datos + archivos (factura, etc.)     |

#### 📤 Subida con `multipart/form-data`:

- Campos del cuerpo:
  - `odeSId`
  - `proveedor`
  - `banco`
  - `cantidad`
  - `montoCobrado` (opcional)
- Archivos:
  - `factura`, `comprobante`, `evidencia` (opcional)

---

### 🗃 Estructura en S3

```
registro-clientes-docs/
└── control-gastos/
    ├── catalogo-bancos.json
    ├── catalogo-proveedores.json
    ├── catalogo-odes.json
    ├── ODES001_datos.json
    ├── ODES001_factura_factura.pdf
    └── ...
```

---

### 📊 Reportes y cálculos

Para calcular el **% de gasto respecto al monto cobrado**, desde el frontend:

```js
const porcentaje = (gasto.cantidad / gasto.montoCobrado) * 100;
```

También puedes agrupar gastos por proveedor, banco o mes filtrando los JSON del bucket.

{uuid}.json                  → datos del cliente (formulario)
{uuid}_ine_nombre.pdf        → archivo relacionado (INE)
{uuid}_acta_nombre.pdf       → archivo relacionado (acta constitutiva)
...
```

---

## ⚙ Variables de entorno (`.env`)

```
AWS_KEY=tu-clave-de-acceso-aws
AWS_SECRET=tu-clave-secreta-aws
PORT=4000
```

---

## 🔧 Comandos

Instalar dependencias:
```bash
npm install
```

Ejecutar localmente:
```bash
node index.js
```

---

## 🛣 Endpoints

### POST `/upload`

Sube datos + archivos.

**Campos esperados (form-data):**
- razonSocial
- representanteLegal
- numeroEscritura
- fechaEscritura
- licenciado
- numeroNotario
- estadoRegistro
- domicilioFiscal
- domiciliosServicio
- correo
- telefono

**Archivos esperados (form-data):**
- ine
- comprobanteDomicilio
- constanciaRFC
- actaConstitutiva
- poderNotariado

Respuesta:
```json
{ "message": "✅ Datos y archivos subidos correctamente a S3", "id": "{uuid}" }
```

---

### GET `/registros`

Lista todos los registros agrupados por ID.

Respuesta:
```json
{
  "registros": [
    {
      "id": "{uuid}",
      "registro": "{uuid}.json",
      "archivos": ["{uuid}_ine_nombre.pdf", ...]
    }
  ]
}
```

---

### GET `/registro/:key`

Obtiene los datos del registro (contenido del JSON).

Respuesta:
```json
{
  "id": "{uuid}",
  "razonSocial": "...",
  "representanteLegal": "...",
  ...
}
```

---

### GET `/archivo/:key`

Genera un link firmado temporal (15 min) para descargar un archivo.

Respuesta:
```json
{
  "url": "https://signed-url-temporal"
}
```

---

## 🛡 Seguridad

✔ Las descargas usan signed URLs para proteger acceso directo.  
✔ Puedes limitar los dominios frontend autorizados en:
```js
app.use(cors({
  origin: ['http://localhost:3000', 'https://tu-frontend-produccion.com'],
}));
```

---

## 💡 Notas

- Usa `uuid` para evitar colisiones en nombres de archivo.
- Si necesitas limpiar el bucket, considera hacerlo desde la consola de AWS o con un script.
- Mantén tus claves AWS seguras y no las subas a GitHub.

---

✏ **Autor:** BLAUCORP TEAM🚀  
