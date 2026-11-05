# Shop inventory and sales API

Express API สำหรับร้านค้าและแอดมิน ไม่มีบัญชีลูกค้า ร้านค้าบันทึกยอดขายจากช่องทางอื่นและระบบหักสต็อกทันที

## เริ่มใช้งาน

ต้องมี Node.js 20+ และ MongoDB แบบ replica set เพราะการสร้างออร์เดอร์และหักสต็อกใช้ transaction เดียวกัน เครื่องนี้มี MongoDB service ที่พอร์ต 27017 แบบ standalone จึงใช้ instance สำหรับโปรเจกต์นี้ที่พอร์ต 27018 โดยไม่แก้ service เดิม

1. เปิด PowerShell และเตรียม `.env`:

   ```powershell
   cd D:\inet\ecommerce
   Copy-Item .env.example .env
   notepad .env
   ```

   ตั้ง `JWT_SECRET` เป็นสตริงสุ่มยาวอย่างน้อย 32 ตัวอักษร และตั้ง `ADMIN_EMAIL`/`ADMIN_PASSWORD` เป็นข้อมูลจริง คง `MONGO_URI=mongodb://localhost:27018/ecommerce?replicaSet=rs0`

2. ใน PowerShell หน้าต่างแรก เริ่ม MongoDB และเปิดหน้าต่างนี้ค้างไว้:

   ```powershell
   cd D:\inet\ecommerce
   New-Item -ItemType Directory -Force .mongo-data | Out-Null
   & 'C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe' --dbpath .mongo-data --port 27018 --replSet rs0 --bind_ip localhost
   ```

3. ใน PowerShell หน้าต่างที่สอง เริ่ม replica set ครั้งแรก สร้างแอดมิน และรัน API:

   ```powershell
   cd D:\inet\ecommerce
   & 'C:\Users\james\AppData\Local\nvm\v24.7.0\node.exe' scripts\init-local-mongo.js
   & 'C:\Users\james\AppData\Local\nvm\v24.7.0\node.exe' scripts\seed-admin.js
   & 'C:\Users\james\AppData\Local\nvm\v24.7.0\node.exe' src\server.js
   ```

   คำสั่ง init และ seed รันซ้ำได้ หลังจากนั้นเปิด `http://localhost:3000/api/health` เพื่อตรวจว่า API ทำงาน

`node_modules` และ `package-lock.json` มีอยู่ใน workspace แล้ว หากย้ายไปเครื่องอื่นให้รัน `npm ci` หลังติดตั้ง Node/npm

## API

Base URL: `http://localhost:3000/api/v1` ส่ง JSON และใช้ `Authorization: Bearer <token>` กับ endpoint ที่ต้องล็อกอิน

| Method | Path | สิทธิ์ | Body |
| --- | --- | --- | --- |
| POST | `/register` | สาธารณะ | `email`, `password`, `shopName` |
| POST | `/login` | สาธารณะ | `email`, `password` |
| GET | `/shops?status=pending` | แอดมิน | - |
| PUT | `/shops/:id/approve` | แอดมิน | - |
| GET | `/products` | ร้านที่อนุมัติ | - |
| POST | `/products` | ร้านที่อนุมัติ | `name`, `description?`, `price`, `stock` |
| GET | `/products/:id` | เจ้าของสินค้า | - |
| PUT | `/products/:id` | เจ้าของสินค้า | `name?`, `description?`, `price?`, `stock?` |
| DELETE | `/products/:id` | เจ้าของสินค้า | - |
| GET | `/orders` | ร้านที่อนุมัติ | - |
| GET | `/products/:id/orders` | เจ้าของสินค้า | - |
| POST | `/products/:id/orders` | เจ้าของสินค้า | `quantity`, `note?` |

`GET /api/health` ไม่ต้องล็อกอิน รายการสินค้า ออร์เดอร์ และร้านที่รออนุมัติรองรับ `page` และ `limit` (ค่าเริ่มต้น 1 และ 20, limit สูงสุด 100) สินค้าที่ซ่อนแล้วไม่อยู่ในรายการสินค้าและรับยอดขายใหม่ไม่ได้ แต่เจ้าของยังดูรายละเอียดและประวัติออร์เดอร์ได้

ตัวอย่าง:

```sh
curl -X POST http://localhost:3000/api/v1/register -H "Content-Type: application/json" -d '{"email":"shop@example.com","password":"strong-password","shopName":"My Shop"}'
curl -X POST http://localhost:3000/api/v1/login -H "Content-Type: application/json" -d '{"email":"shop@example.com","password":"strong-password"}'
curl -X POST http://localhost:3000/api/v1/products -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"Notebook","price":125,"stock":10}'
curl -X POST http://localhost:3000/api/v1/products/PRODUCT_ID/orders -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"quantity":2,"note":"หน้าร้าน"}'
```

ทุก response อยู่ในรูป `{ "status": 200, "message": "...", "data": ... }` รายการที่แบ่งหน้ามี `pagination: { page, limit, total }` เพิ่มเติม ราคาใน API เป็นตัวเลข เช่น `price: 125.50` และยอดรวมคำนวณจาก `price * quantity` โดยตรง ออร์เดอร์เก็บชื่อและราคา ณ เวลาขายเพื่อรักษาประวัติเมื่อมีการแก้สินค้า

หากฐานข้อมูลมีสินค้าหรือออร์เดอร์ที่สร้างก่อนเปลี่ยนชื่อฟิลด์เป็น `price`, `unitPrice` และ `total` ให้หยุด API ตรวจ `MONGO_URI` ใน `.env` แล้วรัน `npm run db:migrate-prices` ก่อนเปิด API ใหม่ คำสั่งนี้รองรับฟิลด์เดิมทั้งชื่อที่ลงท้าย `Satang` และ `Baht` และรันซ้ำได้

## ทดสอบ

`npm test` รันทดสอบที่ไม่ต้องใช้ฐานข้อมูล หากต้องการรัน integration test ให้ตั้ง `MONGO_TEST_URI` ไปยังฐานข้อมูลทดสอบบน replica set แล้วรัน `npm test` อีกครั้ง ห้ามใช้ URI ของข้อมูลจริง
