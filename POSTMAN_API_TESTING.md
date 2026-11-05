# คู่มือทดสอบ API ด้วย Postman

คู่มือนี้อ้างอิง route และ validation ใน `src/` ของโปรเจกต์นี้ ใช้สำหรับสร้าง Collection ใน Postman และทดสอบทีละ endpoint โดยแยก Folder ชัดเจน ตัวอย่างใช้ข้อมูลทดสอบเท่านั้น เพราะคำสั่งสร้างสินค้า ปรับสต็อก บันทึกยอดขาย และอนุมัติร้านจะเปลี่ยนข้อมูลจริงในฐานข้อมูลที่เชื่อมต่ออยู่

## 1. เตรียม API และ Postman

1. ตั้งค่า `.env` และเปิด MongoDB แบบ replica set ตาม `README.md` แล้วรัน `npm run mongo:init`, `npm run seed:admin`, `npm start` ตามลำดับ หากเคย init และ seed แล้วไม่ต้องทำซ้ำ
2. ดูค่า `PORT` ใน `.env` แล้วเปิด `http://localhost:<PORT>/api` เพื่อตรวจว่า API ตอบกลับ เช่น `.env.example` ใช้พอร์ต `5000` ดังนั้น URL คือ `http://localhost:5000/api` **route ตรวจสถานะในโค้ดคือ `/api`**
3. สร้าง Postman Collection ชื่อ `Ecommerce API Tests` และ Environment ชื่อ `Ecommerce Local` เปิดใช้งาน Environment นี้
4. เพิ่มตัวแปร Environment ตามตาราง อย่าใส่รหัสผ่านหรือ token ใน Collection ที่แชร์หรือ commit ขึ้น Git

| ตัวแปร | ค่าเริ่มต้น / ที่มา |
| --- | --- |
| `baseUrl` | `http://localhost:5000/api/v1` (เปลี่ยนพอร์ตให้ตรง `.env`) |
| `rootUrl` | `http://localhost:5000` |
| `adminEmail`, `adminPassword` | ค่าของ `ADMIN_EMAIL`, `ADMIN_PASSWORD` ที่ใช้ seed admin |
| `shopEmail`, `shopPassword` | อีเมลทดสอบใหม่และรหัสผ่านอย่างน้อย 8 ตัวอักษร |
| `shopName` | เช่น `Postman Test Shop` |
| `adminToken`, `shopToken` | เว้นว่างไว้ก่อน; Login จะบันทึกให้ |
| `shopId`, `productId`, `orderId` | เว้นว่างไว้ก่อน; คำขอสร้างข้อมูลจะบันทึกให้ |

ใน Postman เลือก **Body → raw → JSON** สำหรับ request ที่มี body และใช้ header `Content-Type: application/json` (Postman มักเติมให้เมื่อเลือก JSON) ทุก response มีรูป `{ "status": 200, "message": "...", "data": ... }`; HTTP status ต้องตรงกับ `status` ใน JSON ด้วย รายการที่แบ่งหน้ามี `pagination: { "page": 1, "limit": 20, "total": 0 }`

## 2. โครงสร้าง Collection

สร้าง Folder และ Request ตามนี้ แล้วตั้ง Authorization ที่ระดับ Folder เพื่อไม่ต้องใส่ token ซ้ำทุก request

```text
Ecommerce API Tests
├── 00 Health (No Auth)
│   └── GET API info
├── 01 Auth (No Auth)
│   ├── POST Register shop
│   ├── POST Login admin
│   ├── POST Login shop
│   └── GET Me (Shop token)
├── 02 Admin - Shops (Bearer {{adminToken}})
│   ├── GET Pending shops
│   └── PUT Approve shop
├── 03 Shop - Products (Bearer {{shopToken}})
│   ├── GET Products
│   ├── POST Create product
│   ├── GET Product by ID
│   ├── PUT Update product
│   ├── PATCH Adjust stock
│   └── DELETE Archive product
├── 04 Shop - Orders (Bearer {{shopToken}})
│   ├── GET Orders
│   ├── GET Product orders
│   └── POST Record order
└── 05 Negative cases (ตั้ง token ตามแต่ละกรณี)
```

ตั้ง Folder `00` และ `01` เป็น **No Auth**; `GET Me` เป็นข้อยกเว้น ให้ตั้ง request นี้เป็น **Bearer Token** `{{shopToken}}` ตั้ง Folder `02` เป็น Bearer Token `{{adminToken}}` และ Folder `03`/`04` เป็น Bearer Token `{{shopToken}}` ระดับ request ปกติให้เป็น **Inherit auth from parent** Postman จะส่ง `Authorization: Bearer <token>` ให้เอง

## 3. เขียน Test ใน Postman

ที่ request แต่ละอันเปิดแท็บ **Scripts → Post-response** แล้ววาง test ขั้นพื้นฐานนี้ โดยแก้ `expectedStatus` ให้ตรงตารางในหัวข้อถัดไป:

```javascript
const expectedStatus = 200;
pm.test(`HTTP ${expectedStatus}`, () => {
  pm.response.to.have.status(expectedStatus);
});
const body = pm.response.json();
pm.test("response envelope", () => {
  pm.expect(body.status).to.eql(expectedStatus);
  pm.expect(body.message).to.be.a("string");
  pm.expect(body).to.have.property("data");
});
```

สำหรับรายการแบบแบ่งหน้า (`GET /shops`, `/products`, `/orders`, `/products/:id/orders`) เพิ่ม:

```javascript
pm.test("list and pagination", () => {
  pm.expect(body.data).to.be.an("array");
  pm.expect(body.pagination.page).to.eql(1);
  pm.expect(body.pagination.limit).to.eql(20);
  pm.expect(body.pagination.total).to.be.a("number");
});
```

ถ้าใส่ `?page=2&limit=5` ให้เปลี่ยนค่าที่คาดหวังเป็น `2` และ `5` การทดสอบรายการว่างเป็นผลสำเร็จได้: `data` เป็น `[]` และ `total` เป็น `0`

### 00 Health

| Request | URL | คาดหวัง |
| --- | --- | --- |
| GET API info | `{{rootUrl}}/api` | `200`; `data.service` เป็น `ecommerce-shop-api` |

เพิ่มใน Post-response:

```javascript
pm.test("service name", () => {
  pm.expect(body.data.service).to.eql("ecommerce-shop-api");
});
```

### 01 Auth

| Request | URL | Body (raw JSON) | คาดหวัง |
| --- | --- | --- | --- |
| POST Register shop | `{{baseUrl}}/register` | `{"email":"{{shopEmail}}","password":"{{shopPassword}}","shopName":"{{shopName}}"}` | `201`; `data.role = shop`, `data.status = pending` |
| POST Login admin | `{{baseUrl}}/login` | `{"email":"{{adminEmail}}","password":"{{adminPassword}}"}` | `200`; `data.token` เป็น string, `data.account.role = admin` |
| POST Login shop | `{{baseUrl}}/login` | `{"email":"{{shopEmail}}","password":"{{shopPassword}}"}` | `200`; `data.token` เป็น string, `data.account.role = shop` |
| GET Me (Shop token) | `{{baseUrl}}/me` | ไม่มี | `200`; `data.email` ตรง `shopEmail`, `data.status` เป็น `pending` หรือ `approved` ตามขั้นตอน |

ใน **Register shop** เพิ่ม script ต่อท้าย test พื้นฐานเพื่อเก็บ ID:

```javascript
pm.test("registered as pending shop", () => {
  pm.expect(body.data.role).to.eql("shop");
  pm.expect(body.data.status).to.eql("pending");
  pm.expect(body.data.id).to.be.a("string");
});
if (pm.response.code === 201) pm.environment.set("shopId", body.data.id);
```

ใน **Login admin** เพิ่ม:

```javascript
pm.test("admin login", () => {
  pm.expect(body.data.account.role).to.eql("admin");
  pm.expect(body.data.token).to.be.a("string");
});
if (pm.response.code === 200) pm.environment.set("adminToken", body.data.token);
```

ใน **Login shop** ใช้ script เดียวกัน แต่เปลี่ยน `admin` เป็น `shop` และ `adminToken` เป็น `shopToken` สำหรับ **Me** ตรวจ `body.data.email === pm.environment.get("shopEmail")` ด้วย

> ใช้อีเมลทดสอบใหม่เมื่อรัน Register ซ้ำ เพราะอีเมลที่มีอยู่แล้วตอบ `409` หากต้องการรันเฉพาะ request หลัง Register ให้ใช้บัญชีร้านที่สร้างไว้และ Login ใหม่ได้

### 02 Admin - Shops

| Request | URL | Body | คาดหวัง |
| --- | --- | --- | --- |
| GET Pending shops | `{{baseUrl}}/shops?status=pending` | ไม่มี | `200`; รายการและ `pagination`; ร้านที่เพิ่งสมัครอยู่ในรายการก่อนอนุมัติ |
| PUT Approve shop | `{{baseUrl}}/shops/{{shopId}}/approve` | ไม่มี | `200`; `data.id = shopId`, `data.status = approved` |

ใน **Pending shops** เพิ่ม (หากมีร้านรออนุมัติมากกว่า 20 ร้าน ให้ใช้ `?status=pending&limit=100` และแก้ test limit):

```javascript
pm.test("new shop is pending", () => {
  pm.expect(body.data.some(shop => shop.id === pm.environment.get("shopId"))).to.eql(true);
});
```

ใน **Approve shop** เพิ่ม:

```javascript
pm.test("shop approved", () => {
  pm.expect(body.data.id).to.eql(pm.environment.get("shopId"));
  pm.expect(body.data.status).to.eql("approved");
});
```

หลังอนุมัติ เรียก `GET Me` อีกครั้งเพื่อยืนยันสถานะ `approved` (token เดิมยังใช้ได้ เพราะ middleware อ่านบัญชีจากฐานข้อมูลทุกครั้ง) การอนุมัติซ้ำตอบ `409`

### 03 Shop - Products

| Request | URL | Body (raw JSON) | คาดหวัง / ตรวจเพิ่ม |
| --- | --- | --- | --- |
| GET Products | `{{baseUrl}}/products?page=1&limit=20` | ไม่มี | `200`; `data` เป็น array และมี `pagination` |
| POST Create product | `{{baseUrl}}/products` | `{"name":"Postman Notebook","description":"Test item","priceSatang":12500,"stock":10}` | `201`; `data._id` มีค่า, `stock = 10`, `priceSatang = 12500` |
| GET Product by ID | `{{baseUrl}}/products/{{productId}}` | ไม่มี | `200`; `data._id = productId` |
| PUT Update product | `{{baseUrl}}/products/{{productId}}` | `{"name":"Postman Notebook v2","priceSatang":13000}` | `200`; ชื่อและราคาเปลี่ยน, สต็อกไม่เปลี่ยน |
| PATCH Adjust stock | `{{baseUrl}}/products/{{productId}}/stock` | `{"delta":5}` | `200`; `stock` เพิ่ม 5; ใช้ `-5` เพื่อลด |
| DELETE Archive product | `{{baseUrl}}/products/{{productId}}` | ไม่มี | `200`; `data.isActive = false` |

ใน **Create product** เพิ่ม script เก็บ ID:

```javascript
pm.test("product created", () => {
  pm.expect(body.data._id).to.be.a("string");
  pm.expect(body.data.stock).to.eql(10);
  pm.expect(body.data.priceSatang).to.eql(12500);
});
if (pm.response.code === 201) pm.environment.set("productId", body.data._id);
```

สำหรับ **GET Product by ID** และ **PUT Update product** เพิ่ม `pm.expect(body.data._id).to.eql(pm.environment.get("productId"))` ภายใน `pm.test(...)` สำหรับ **PATCH Adjust stock** ตรวจค่า `stock` ที่คาดหวังตามลำดับที่รัน (ตัวอย่างสร้าง 10 แล้วเพิ่ม 5 ต้องได้ 15)

ราคา `priceSatang` มีหน่วยเป็นสตางค์: `12500` เท่ากับ 125 บาท `PUT` ห้ามส่ง `stock`; ใช้ `PATCH /stock` เท่านั้น `DELETE` เป็นการซ่อนสินค้า (`isActive = false`) จึงควรรันท้ายสุด หลังทดสอบ Order แล้ว รายการสินค้าไม่รวมสินค้าที่ซ่อน แต่ `GET /products/{{productId}}` ยังอ่านรายละเอียดของเจ้าของได้

### 04 Shop - Orders

| Request | URL | Body (raw JSON) | คาดหวัง / ตรวจเพิ่ม |
| --- | --- | --- | --- |
| GET Orders | `{{baseUrl}}/orders?page=1&limit=20` | ไม่มี | `200`; รายการทุก order ของร้านและ `pagination` |
| GET Product orders | `{{baseUrl}}/products/{{productId}}/orders?page=1&limit=20` | ไม่มี | `200`; เฉพาะ order ของสินค้านี้และ `pagination` |
| POST Record order | `{{baseUrl}}/products/{{productId}}/orders` | `{"quantity":2,"note":"Postman test"}` | `201`; `quantity = 2`; `totalSatang = unitPriceSatang × 2` |

ใน **Record order** เพิ่ม:

```javascript
pm.test("order total", () => {
  pm.expect(body.data.quantity).to.eql(2);
  pm.expect(body.data.totalSatang).to.eql(body.data.unitPriceSatang * 2);
  pm.expect(String(body.data.productId)).to.eql(pm.environment.get("productId"));
});
if (pm.response.code === 201) pm.environment.set("orderId", body.data._id);
```

หลังบันทึก order ให้เรียก `GET Product by ID` เพื่อตรวจว่าสต็อกลดลง 2 แล้วเรียก `GET Orders` และ `GET Product orders` เพื่อตรวจว่ามี `_id === {{orderId}}` ใน `data` เมื่อ `DELETE` สินค้าแล้ว ยังเรียก `GET Product orders` เพื่อดูประวัติได้ แต่สร้าง order ใหม่จากสินค้าที่ซ่อนจะตอบ `404` การบันทึก order ต้องใช้ MongoDB replica set เพราะ API ใช้ transaction

## 4. ลำดับทดสอบตั้งแต่ต้นจนจบ

1. `GET API info` → ตรวจเซิร์ฟเวอร์
2. `POST Register shop` → ได้ `shopId`; `POST Login shop` → ได้ `shopToken`
3. ทดลอง `GET Me` และ `POST Create product` ก่อนอนุมัติ → `GET Me` ได้ `pending`, สร้างสินค้าได้ `403`
4. `POST Login admin` → ได้ `adminToken`; `GET Pending shops` → เห็นร้านใหม่; `PUT Approve shop` → `approved`
5. `GET Me` อีกครั้ง → `approved`; `POST Create product` → ได้ `productId`
6. `GET Products`, `GET Product by ID`, `PUT Update product`, `PATCH Adjust stock`
7. `POST Record order` → ได้ `orderId`; `GET Orders`, `GET Product orders`, `GET Product by ID` → ตรวจยอดและสต็อก
8. `DELETE Archive product` → ตรวจ `isActive = false`; `GET Product orders` → ประวัติยังอยู่

**ข้อควรระวังของ Collection Runner:** ลำดับ Folder สำหรับการสอนนี้ไม่ใช่ลำดับรันอัตโนมัติทั้งหมด เพราะ `DELETE` ใน Folder Products ต้องเกิดหลัง `POST Record order` และบาง request มีค่าคาดหวังต่างกันก่อน/หลังอนุมัติ ควรรันทีละ request ตามรายการข้างบน หรือทำสำเนา request ไปยัง Folder `06 E2E Flow` แล้วเรียงตามลำดับนี้ก่อนใช้ Runner

## 5. Negative cases ที่ควรแยกไว้

สร้าง request สำเนาใน Folder `05 Negative cases` เพื่อไม่แก้ body หรือ token ของกรณีสำเร็จ ใช้ test พื้นฐานด้านบนโดยเปลี่ยน `expectedStatus`; error response มี `data: null`

| กรณี | วิธีส่ง | คาดหวัง |
| --- | --- | --- |
| ไม่มี token | `GET {{baseUrl}}/me`, ตั้ง No Auth | `401` |
| token ไม่ถูกต้อง | `GET /me`, Bearer Token `invalid` | `401` |
| Login รหัสผ่านผิด | `POST /login`, อีเมลถูกแต่ password ผิด | `401` |
| สมัครอีเมลซ้ำ | `POST /register` ด้วย `shopEmail` เดิม | `409` |
| body ไม่ครบ | `POST /products` โดยไม่ส่ง `priceSatang` | `400` |
| `stock` ผิด endpoint | `PUT /products/{{productId}}` ด้วย `{"stock":99}` | `400` |
| `delta` เป็น 0 | `PATCH /products/{{productId}}/stock` ด้วย `{"delta":0}` | `400` |
| สต็อกไม่พอ | `POST /products/{{productId}}/orders` ด้วย `quantity` มากกว่าสต็อก | `409`; สต็อกไม่ลด |
| ร้านเรียก endpoint admin | `GET /shops`, ใช้ `shopToken` | `403` |
| Admin เรียก endpoint ร้าน | `GET /products`, ใช้ `adminToken` | `403` |
| ID ผิดรูปแบบ | `GET /products/not-an-id` | `400` |
| `limit` เกิน | `GET /products?limit=101` | `400` |
| path ที่ไม่มี | `GET {{baseUrl}}/unknown` | `404` |

ตัวอย่าง script สำหรับกรณี error:

```javascript
pm.test("HTTP 401 and error body", () => {
  pm.response.to.have.status(401);
  const error = pm.response.json();
  pm.expect(error.status).to.eql(401);
  pm.expect(error.message).to.be.a("string");
  pm.expect(error.data).to.eql(null);
});
```

เมื่อจบทดสอบ ตรวจว่าตัวแปร `adminToken` และ `shopToken` ยังอยู่เฉพาะใน Environment ส่วนตัว และใช้ฐานข้อมูลทดสอบแยกจากข้อมูลจริงหากต้องรันชุดนี้ซ้ำบ่อย ๆ
