# CLAUDE.md — KostKu Backend

> Dibaca oleh Claude Code untuk memahami konteks, konvensi, dan aturan backend KostKu sebelum menulis atau memodifikasi kode apapun.

---

## 🧱 Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|-----------|
| Node.js | ≥ 18.0 | Runtime |
| Express.js | ^4.18 | Web framework |
| MongoDB | ≥ 7.0 | Database utama |
| Mongoose | ^8.0 | ODM (Object Document Mapper) |
| Redis | ≥ 7.0 | Cache + session + job queue |
| Bull | ^4.0 | Background jobs & cron |
| JWT | ^9.0 | Autentikasi |
| bcryptjs | ^2.4 | Hash password |
| Yup | ^1.3 | Validasi request body/params |
| Multer | ^1.4 | Upload file |
| AWS SDK v3 | ^3.0 | S3 / Cloudflare R2 storage |

---

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts           # Koneksi MongoDB via Mongoose
│   │   ├── redis.ts        # Koneksi Redis
│   │   └── env.ts          # Validasi env variables saat startup
│   │
│   ├── models/             # Mongoose models (schema + methods)
│   │   ├── User.model.ts
│   │   ├── Property.model.ts
│   │   ├── Room.model.ts
│   │   ├── RoomPhoto.model.ts
│   │   ├── Tenant.model.ts
│   │   ├── Contract.model.ts
│   │   ├── Invoice.model.ts
│   │   ├── Payment.model.ts
│   │   ├── UtilityReading.model.ts
│   │   ├── MaintenanceRequest.model.ts
│   │   ├── Expense.model.ts
│   │   ├── Announcement.model.ts
│   │   └── Notification.model.ts
│   │
│   ├── controllers/        # Request handlers — TIPIS, logika di service
│   │   ├── auth.controller.ts
│   │   ├── property.controller.ts
│   │   ├── room.controller.ts
│   │   ├── tenant.controller.ts
│   │   ├── contract.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── maintenance.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── report.controller.ts
│   │   ├── notification.controller.ts
│   │   └── portal.controller.ts    # Untuk penghuni
│   │
│   ├── services/           # Business logic utama
│   │   ├── auth.service.ts
│   │   ├── invoice.service.ts      # Logic generate + update status
│   │   ├── payment.service.ts      # Logic catat bayar + update invoice
│   │   ├── whatsapp.service.ts     # Kirim WA via API
│   │   ├── storage.service.ts      # Upload ke S3/R2
│   │   ├── pdf.service.ts          # Generate PDF invoice & kontrak
│   │   └── report.service.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Verifikasi JWT
│   │   ├── role.middleware.ts      # Cek role (owner/manager/cashier)
│   │   ├── validate.middleware.ts  # Wrapper Yup validation
│   │   ├── upload.middleware.ts    # Multer config
│   │   └── errorHandler.ts        # Global error handler
│   │
│   ├── routes/
│   │   ├── index.ts                # Mount semua route
│   │   ├── auth.routes.ts
│   │   ├── property.routes.ts
│   │   ├── room.routes.ts
│   │   ├── tenant.routes.ts
│   │   ├── contract.routes.ts
│   │   ├── invoice.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── maintenance.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── report.routes.ts
│   │   ├── notification.routes.ts
│   │   └── portal.routes.ts
│   │
│   ├── jobs/               # Bull queue jobs (background tasks)
│   │   ├── generateInvoice.job.ts  # Cron: tiap tgl 1
│   │   ├── checkOverdue.job.ts     # Cron: tiap tengah malam
│   │   ├── checkContract.job.ts    # Cron: tiap pagi, cek kontrak hampir habis
│   │   ├── sendReminder.job.ts     # Queue: kirim WA reminder
│   │   └── index.ts                # Init semua queue & schedule
│   │
│   ├── schemas/            # Yup validation schemas
│   │   ├── auth.schema.ts
│   │   ├── room.schema.ts
│   │   ├── tenant.schema.ts
│   │   ├── contract.schema.ts
│   │   ├── invoice.schema.ts
│   │   └── payment.schema.ts
│   │
│   ├── utils/
│   │   ├── AppError.ts             # Custom error class
│   │   ├── generateInvoiceNumber.ts
│   │   ├── formatRupiah.ts
│   │   └── logger.ts
│   │
│   └── index.ts            # Entry point Express app
│
├── .env.example
├── .env                    # JANGAN commit ke git
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database — MongoDB + Mongoose

### Aturan Umum Model

- Setiap model di file terpisah: `NamaModel.model.ts`
- Selalu definisikan **TypeScript interface** untuk dokumen
- Gunakan **Mongoose Schema** dengan `timestamps: true` — otomatis tambah `createdAt` dan `updatedAt`
- Gunakan `Types.ObjectId` untuk referensi antar dokumen
- Field yang bertipe enum **harus** pakai `enum: [...]` di schema

### Contoh Model — Template Standar

```typescript
// src/models/Room.model.ts
import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IRoom extends Document {
  property_id: Types.ObjectId
  room_number: string
  room_type: string
  price_monthly: number
  price_yearly?: number
  floor?: number
  size_sqm?: number
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  facilities?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>(
  {
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    room_number: { type: String, required: true, trim: true },
    room_type: { type: String, required: true },
    price_monthly: { type: Number, required: true, min: 0 },
    price_yearly: { type: Number, min: 0 },
    floor: { type: Number },
    size_sqm: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
      index: true,
    },
    facilities: { type: String },
    description: { type: String },
  },
  { timestamps: true }
)

// Compound index: room_number unik per properti
RoomSchema.index({ property_id: 1, room_number: 1 }, { unique: true })

export const Room = mongoose.model<IRoom>('Room', RoomSchema)
```

### Relasi Antar Dokumen

MongoDB tidak enforce foreign key — kita handle di aplikasi. Konvensi relasi:

```typescript
// Satu-ke-banyak: simpan parent _id di child
// Room → property_id: Types.ObjectId (ref: 'Property')
// Invoice → contract_id, room_id, tenant_id

// Populate saat query (gunakan secara selektif, jangan over-populate)
const invoice = await Invoice.findById(id)
  .populate('tenant_id', 'full_name phone')   // hanya field yang perlu
  .populate('room_id', 'room_number floor')
```

### Index yang Wajib Ada

```typescript
// Users
UserSchema.index({ email: 1 }, { unique: true })

// Tenants
TenantSchema.index({ nik: 1 }, { unique: true })

// Rooms
RoomSchema.index({ property_id: 1, room_number: 1 }, { unique: true })
RoomSchema.index({ property_id: 1, status: 1 })

// Contracts
ContractSchema.index({ room_id: 1, status: 1 })
ContractSchema.index({ tenant_id: 1 })
// Partial unique: satu kamar hanya boleh punya 1 kontrak aktif
ContractSchema.index(
  { room_id: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
)

// Invoices
InvoiceSchema.index({ invoice_number: 1 }, { unique: true })
InvoiceSchema.index({ tenant_id: 1, status: 1 })
InvoiceSchema.index({ due_date: 1, status: 1 })  // Untuk cron overdue check

// Notifications
NotificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 })
```

---

## ✅ Validasi — Yup

Semua validasi request menggunakan **Yup**. Schema disimpan di `src/schemas/`.

### Struktur Schema

```typescript
// src/schemas/room.schema.ts
import * as yup from 'yup'

export const createRoomSchema = yup.object({
  room_number: yup.string().required('Nomor kamar wajib diisi').max(20),
  room_type: yup.string().required('Tipe kamar wajib diisi'),
  price_monthly: yup
    .number()
    .required('Harga bulanan wajib diisi')
    .positive('Harga harus lebih dari 0'),
  price_yearly: yup.number().positive().nullable(),
  floor: yup.number().integer().nullable(),
  size_sqm: yup.number().positive().nullable(),
  status: yup
    .string()
    .oneOf(['available', 'maintenance'])
    .default('available'),
  facilities: yup.string().nullable(),
  description: yup.string().nullable(),
})

export const updateRoomSchema = createRoomSchema.partial()

// Type inference dari Yup schema
export type CreateRoomDto = yup.InferType<typeof createRoomSchema>
export type UpdateRoomDto = yup.InferType<typeof updateRoomSchema>
```

### Middleware Validasi

```typescript
// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import * as yup from 'yup'

type SchemaType = 'body' | 'params' | 'query'

export const validate = (schema: yup.AnyObjectSchema, source: SchemaType = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.validate(req[source], {
        abortEarly: false,  // Tampilkan semua error sekaligus
        stripUnknown: true, // Hapus field yang tidak ada di schema
      })
      req[source] = validated
      next()
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data tidak valid',
            details: err.inner.map((e) => ({
              field: e.path,
              message: e.message,
            })),
          },
        })
      }
      next(err)
    }
  }
}
```

### Penggunaan di Route

```typescript
// src/routes/room.routes.ts
import { validate } from '../middlewares/validate.middleware'
import { createRoomSchema, updateRoomSchema } from '../schemas/room.schema'

router.post('/',
  authenticateToken,
  requireRole(['owner', 'manager']),
  validate(createRoomSchema),        // validasi req.body
  roomController.create
)

router.put('/:id',
  authenticateToken,
  requireRole(['owner', 'manager']),
  validate(updateRoomSchema),
  roomController.update
)
```

---

## 🔐 Auth & Role System

### JWT Config

```typescript
// Access token: expire 15 menit
// Refresh token: expire 30 hari, disimpan di Redis

const accessToken = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '15m' }
)

const refreshToken = jwt.sign(
  { userId: user._id },
  process.env.JWT_REFRESH_SECRET!,
  { expiresIn: '30d' }
)

// Simpan refresh token di Redis dengan key: `refresh:{userId}`
await redis.setEx(`refresh:${user._id}`, 30 * 24 * 60 * 60, refreshToken)
```

### Role Enum

```typescript
// 3 role untuk pengelola kost:
type UserRole = 'owner' | 'manager' | 'cashier'

// owner   → akses penuh semua resource miliknya
// manager → CRUD operasional, tidak bisa DELETE properti/kelola staff
// cashier → hanya catat pembayaran dan lihat invoice

// Penghuni (tenant) TIDAK pakai sistem role ini
// Mereka login via /portal/auth/login dengan auth terpisah
```

### Middleware Stack (urutan wajib di setiap route)

```typescript
router.post('/invoices/generate',
  authenticateToken,                        // 1. Verify JWT
  requireRole(['owner', 'manager']),         // 2. Check role
  validate(generateInvoiceSchema),           // 3. Validate body (Yup)
  invoiceController.generate                 // 4. Handler
)
```

### Multi-tenant Security — WAJIB

```typescript
// SELALU filter query dengan owner/property context
// Ini mencegah satu owner bisa akses data owner lain

// ✅ BENAR
const rooms = await Room.find({
  property_id: { $in: req.user.propertyIds }  // atau property_id dari params
})

// ❌ BERBAHAYA — bisa cross-tenant data leak
const rooms = await Room.find({})
```

---

## 🔌 API Conventions

### Base URL
```
/api/v1
```

### Response Format — SELALU konsisten

```typescript
// Success — list
{
  success: true,
  data: [...],
  meta: {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
}

// Success — single
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: "INVOICE_NOT_FOUND",
    message: "Invoice tidak ditemukan"
  }
}

// Validation Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Data tidak valid",
    details: [
      { field: "price_monthly", message: "Harga bulanan wajib diisi" }
    ]
  }
}
```

### HTTP Status Codes

```
200 → OK
201 → Created
204 → No Content (DELETE)
400 → Bad Request / Validation Error
401 → Unauthorized (token tidak valid)
403 → Forbidden (role tidak cukup)
404 → Not Found
409 → Conflict (kamar sudah ada kontrak aktif, email duplikat)
422 → Unprocessable (logika bisnis gagal — penghuni di-blacklist, dll)
500 → Internal Server Error
```

---

## ⚙️ Business Logic Penting

### 1. Generate Invoice Otomatis (Cron Job)

```typescript
// jobs/generateInvoice.job.ts
// Jadwal: setiap tanggal 1, jam 00.01 WIB
// Cron expression: '1 0 1 * *'

// Alur:
// 1. Query semua contracts WHERE status = 'active'
// 2. Untuk setiap kontrak:
//    a. Cek apakah invoice bulan ini sudah ada (hindari duplicate)
//    b. Ambil utility_readings bulan ini untuk room tsb
//    c. Hitung: total = base + electricity + water + other_fees
//    d. Generate invoice_number (format: INV-YYMM-XXXX)
//    e. Insert Invoice dengan status = 'draft'
// 3. Setelah semua invoice dibuat:
//    → Queue job kirim WA ke semua penghuni
//    → Update invoice status = 'sent'
```

### 2. Cek Overdue Harian

```typescript
// jobs/checkOverdue.job.ts
// Jadwal: setiap tengah malam '0 0 * * *'

// Query invoice yang overdue:
const overdueInvoices = await Invoice.find({
  due_date: { $lt: new Date() },
  status: { $in: ['sent', 'partial'] }
})

// Update setiap invoice:
// - status = 'overdue'
// - late_fee += (hari_terlambat × Rp 5.000)
// - Kirim WA reminder ke penghuni
```

### 3. Catat Pembayaran — Atomic Operation

```typescript
// Gunakan MongoDB session untuk atomic operation
const session = await mongoose.startSession()
session.startTransaction()

try {
  // 1. Insert payment
  const payment = await Payment.create([{ ...paymentData }], { session })

  // 2. Update paid_amount di invoice
  const invoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    { $inc: { paid_amount: amount } },
    { new: true, session }
  )

  // 3. Cek apakah sudah lunas
  if (invoice.paid_amount >= invoice.total_amount) {
    await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'paid' },
      { session }
    )
    // Queue kirim kuitansi PDF via WA
    await receiptQueue.add({ invoiceId })
  }

  await session.commitTransaction()
} catch (err) {
  await session.abortTransaction()
  throw err
} finally {
  session.endSession()
}
```

### 4. Buat Kontrak Baru

```typescript
// Urutan validasi WAJIB sebelum insert:
// a. Cek room.status === 'available'
// b. Cek tidak ada Contract aktif di room ini
//    Contract.findOne({ room_id, status: 'active' }) → harus null
// c. Cek tenant.is_blacklisted === false

// Setelah kontrak berhasil dibuat:
// → UPDATE Room SET status = 'occupied'
// → Kirim PDF kontrak via WA ke penghuni
```

### 5. Check-out Penghuni

```typescript
// Urutan WAJIB:
// 1. Cek semua invoice outstanding (status: sent/partial/overdue)
// 2. Hitung total kewajiban = sum(invoice.total - invoice.paid)
// 3. Hitung pengembalian deposit:
//    returned = deposit_amount - total_kewajiban - biaya_kerusakan
// 4. Update Contract: status='terminated', deposit_status='returned'
// 5. Update Room: status='available'
// 6. Kirim dokumen check-out via WA
```

---

## 🔄 Background Jobs (Bull + Redis)

### Queue yang Ada

```typescript
// src/jobs/index.ts
export const whatsappQueue = new Bull('whatsapp', redisConfig)
export const invoiceQueue = new Bull('invoice', redisConfig)
export const receiptQueue = new Bull('receipt', redisConfig)
export const notificationQueue = new Bull('notification', redisConfig)
```

### Aturan Queue

- **Jangan pernah** kirim WA atau email langsung dari request handler
- Semua operasi yang bisa lambat (PDF gen, WA, email) → masuk queue
- Retry strategy: 3 kali, dengan exponential backoff
- Logging setiap job yang gagal setelah semua retry habis

```typescript
whatsappQueue.process(async (job) => {
  const { phone, template, params } = job.data
  await whatsappService.send(phone, template, params)
})

whatsappQueue.on('failed', (job, err) => {
  logger.error('WA queue job failed', {
    jobId: job.id,
    data: job.data,
    error: err.message,
    attemptsMade: job.attemptsMade
  })
})
```

---

## 🌍 Integrasi Eksternal

### WhatsApp Business API

```typescript
// Service: src/services/whatsapp.service.ts
// Gunakan template yang sudah approved di Meta Business Manager
// Base URL: https://graph.facebook.com/v18.0/{phone_number_id}/messages

// Template yang dipakai:
// - invoice_created    → saat invoice baru dikirim
// - invoice_reminder   → H-3 sebelum due_date
// - invoice_overdue    → saat status berubah overdue
// - payment_received   → saat invoice lunas (kirim kuitansi)
// - contract_expiring  → H-30, H-14, H-7 sebelum kontrak habis
// - maintenance_update → saat status tiket maintenance berubah
```

### Midtrans

```typescript
// Webhook: POST /api/v1/payments/webhook
// WAJIB verifikasi signature sebelum proses:

const expectedSignature = crypto
  .createHash('sha512')
  .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
  .digest('hex')

if (signature !== expectedSignature) {
  return res.status(403).json({ message: 'Invalid signature' })
}
```

### AWS S3 / Cloudflare R2

```typescript
// Struktur folder di bucket:
// public/  → foto kamar (CDN URL langsung)
//   rooms/{room_id}/{filename}
//   announcements/{filename}

// private/ → dokumen sensitif (hanya via signed URL, expire 5 menit)
//   tenants/{tenant_id}/ktp/{filename}
//   contracts/{contract_id}/contract.pdf
//   invoices/{invoice_id}/receipt.pdf
```

---

## ⚠️ Hal yang Wajib Diperhatikan

```typescript
// ❌ JANGAN — query tanpa filter owner (data leak antar tenant)
const rooms = await Room.find({})

// ❌ JANGAN — simpan password plain text
user.password = req.body.password

// ❌ JANGAN — return KTP URL langsung (harus signed URL)
return res.json({ ktp_photo_url: tenant.ktp_photo_url })

// ❌ JANGAN — operasi berat langsung di request handler
await generatePdfAndSendWA(invoice) // taruh di queue

// ✅ SELALU — filter berdasarkan owner context
const rooms = await Room.find({
  property_id: { $in: userPropertyIds }
})

// ✅ SELALU — hash password dengan bcrypt (salt rounds: 12)
const hashedPassword = await bcrypt.hash(password, 12)

// ✅ SELALU — gunakan MongoDB session untuk operasi atomic
const session = await mongoose.startSession()

// ✅ SELALU — generate signed URL untuk file sensitif
const signedUrl = await storageService.getSignedUrl(key, 300) // 5 menit
```

---

## 🧪 Testing

```bash
# Test database terpisah
MONGODB_URI=mongodb://localhost:27017/kostku_test

# Jalankan test
npm run test
npm run test:watch
npm run test:coverage
```

### Prioritas Test

1. Service layer (unit test — paling penting)
2. API endpoints (integration test dengan Supertest)
3. Cron jobs / queue jobs

---

## 🚀 Cara Jalankan Lokal

```bash
# 1. Copy dan isi environment
cp .env.example .env

# 2. Start MongoDB dan Redis via Docker
docker-compose up -d mongodb redis

# 3. Install dependencies
npm install

# 4. Jalankan development server
npm run dev   # port 3001

# 5. (Opsional) Seed data dummy
npm run seed
```

---

## 📋 Checklist Sebelum Push

- [ ] Tidak ada `console.log` yang tertinggal (pakai `logger`)
- [ ] Semua endpoint baru ada validasi Yup
- [ ] Semua endpoint baru ada `authenticateToken` middleware
- [ ] Semua query MongoDB ada filter owner/property context
- [ ] Tidak ada secret yang di-hardcode (pakai `process.env`)
- [ ] Error dihandle lewat `AppError`, bukan crash
- [ ] Operasi berat (WA, PDF, email) masuk queue, bukan langsung di handler
- [ ] Index MongoDB sudah ditambahkan untuk field yang sering di-query