# คู่มือทดสอบ API ด้วย Postman

คู่มือนี้ใช้ส่ง request ทดสอบ API ทีละ endpoint ใน Postman โดยกรอก URL, Authorization และ Body ตามตัวอย่าง แล้วดู HTTP status กับข้อมูลที่ตอบกลับ **ไม่ต้องใช้ Test Script** การสมัครร้าน อนุมัติร้าน สร้างสินค้า ปรับสต็อก และบันทึก order จะเปลี่ยนข้อมูลในฐานข้อมูล จึงควรใช้ฐานข้อมูลทดสอบ

## เตรียมใช้งาน

1. เปิด MongoDB และ API ตาม `README.md`
2. ดู `PORT` ใน `.env` ตัวอย่างด้านล่างใช้ `http://localhost:5000` ถ้าใช้พอร์ตอื่นให้เปลี่ยนทุก URL
3. สร้าง Postman Collection ชื่อ `Ecommerce API` และ Folder ตามรายการด้านล่าง
4. Request ที่มี Body ให้เลือก **Body → raw → JSON** แล้ววาง JSON ตามตัวอย่าง
5. Request ที่ต้องล็อกอิน ให้เลือก **Authorization → Bearer Token** แล้ววาง token ที่ได้จาก Login สามารถตั้ง token ที่ระดับ Folder และให้ request ใช้ **Inherit auth from parent**

Response ปกติอยู่ในรูป `{"status":200,"message":"...","data":...}` โดย `status` ควรตรงกับ HTTP status ที่ Postman แสดง รายการที่แบ่งหน้าจะมี `pagination` เพิ่มมา

```text
Ecommerce API
├── 00 Health
│   └── GET API info
├── 01 Authentication
│   ├── POST Register shop
│   ├── POST Login admin
│   ├── POST Login shop
├── 02 Admin - Shops
│   ├── GET Pending shops
│   └── PUT Approve shop
├── 03 Shop - Products
│   ├── GET Products
│   ├── POST Create product
│   ├── GET Product by ID
│   ├── PUT Update product
│   └── DELETE Archive product
├── 04 Shop - Orders
│   ├── GET Orders
│   ├── GET Product orders
│   └── POST Record order
└── 05 Error examples
```

## 00 Health

| Request | URL | Authorization | Body | ผลที่คาดหวัง |
| --- | --- | --- | --- | --- |
| GET API info | `http://localhost:5000/api` | ไม่มี | ไม่มี | `200`; `data.service` เป็น `ecommerce-shop-api` |

## 01 Authentication

### POST Register shop

- URL: `http://localhost:5000/api/v1/register`
- Authorization: ไม่มี
- Body:

```json
{
  "email": "postman-shop@example.com",
  "password": "test-password-123",
  "shopName": "Postman Test Shop"
}
```

ผลที่คาดหวัง: `201`; `data.role` เป็น `shop`, `data.status` เป็น `pending` จด `data.id` ไว้เป็น **shopId** อีเมลต้องยังไม่เคยสมัคร และรหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร

### POST Login admin

- URL: `http://localhost:5000/api/v1/login`
- Authorization: ไม่มี
- Body: ใช้ค่าแอดมินที่ตั้งไว้ใน `.env` และ seed แล้ว

```json
{
  "email": "admin@example.com",
  "password": "รหัสผ่านแอดมินจริง"
}
```

ผลที่คาดหวัง: `200`; `data.account.role` เป็น `admin` จด `data.token` ไว้เป็น **adminToken**

### POST Login shop

- URL: `http://localhost:5000/api/v1/login`
- Authorization: ไม่มี
- Body:

```json
{
  "email": "postman-shop@example.com",
  "password": "test-password-123"
}
```

ผลที่คาดหวัง: `200`; `data.account.role` เป็น `shop` จด `data.token` ไว้เป็น **shopToken**

## 02 Admin - Shops

ตั้ง Bearer Token = **adminToken** ที่ Folder นี้

| Request | URL | Body | ผลที่คาดหวัง |
| --- | --- | --- | --- |
| GET Pending shops | `http://localhost:5000/api/v1/shops?status=pending&page=1&limit=20` | ไม่มี | `200`; `data` เป็นรายการร้านรออนุมัติและมี `pagination` |
| PUT Approve shop | `http://localhost:5000/api/v1/shops/SHOP_ID/approve` | ไม่มี | `200`; `data.status` เป็น `approved` |

แทน `SHOP_ID` ด้วย **shopId** จาก Register หากร้านที่เพิ่งสมัครไม่อยู่ในหน้าแรกของรายการ pending ให้เพิ่ม `limit` ได้สูงสุด `100` การอนุมัติร้านเดิมซ้ำจะได้ `409`

## 03 Shop - Products

ตั้ง Bearer Token = **shopToken** ที่ Folder นี้ ร้านต้องได้รับอนุมัติก่อน มิฉะนั้นจะได้ `403`

| Request | URL | Body | ผลที่คาดหวัง |
| --- | --- | --- | --- |
| GET Products | `http://localhost:5000/api/v1/products?page=1&limit=20` | ไม่มี | `200`; `data` เป็นรายการสินค้าและมี `pagination` |
| GET Product by ID | `http://localhost:5000/api/v1/products/PRODUCT_ID` | ไม่มี | `200`; `data._id` ตรงกับ productId |
| DELETE Archive product | `http://localhost:5000/api/v1/products/PRODUCT_ID` | ไม่มี | `200`; `data.isActive` เป็น `false` |

แทน `PRODUCT_ID` ด้วย **productId** จาก Create product ให้ทดสอบ DELETE หลัง Record order เพราะสินค้าที่ซ่อนแล้วจะบันทึก order ใหม่ไม่ได้

### POST Create product

- URL: `http://localhost:5000/api/v1/products`
- Body:

```json
{
  "name": "Notebook",
  "description": "สินค้าทดสอบ",
  "price": 125,
  "stock": 10
}
```

ผลที่คาดหวัง: `201`; `stock` เป็น `10` และ `price` เป็น `125` จด `data._id` ไว้เป็น **productId** ค่าราคายังเป็นบาทและใส่ทศนิยมได้ไม่เกิน 2 ตำแหน่ง เช่น `125.50` `description` ไม่ใส่ก็ได้

### PUT Update product

- URL: `http://localhost:5000/api/v1/products/PRODUCT_ID`
- Body: ใส่เฉพาะค่าที่ต้องการแก้

```json
{
  "name": "Notebook v2",
  "price": 130,
  "stock": 15
}
```

ผลที่คาดหวัง: `200`; ชื่อ ราคา และสต็อกเปลี่ยนเป็นค่าที่ส่ง (`stock: 15`) สามารถส่งเฉพาะฟิลด์ที่ต้องการแก้ได้ ถ้าต้องการเปลี่ยนสต็อกอย่างเดียวให้ส่ง `{"stock":15}`

## 04 Shop - Orders

ตั้ง Bearer Token = **shopToken** ที่ Folder นี้ การบันทึก order ต้องใช้ MongoDB แบบ replica set เพราะ API ใช้ transaction

| Request | URL | Body | ผลที่คาดหวัง |
| --- | --- | --- | --- |
| GET Orders | `http://localhost:5000/api/v1/orders?page=1&limit=20` | ไม่มี | `200`; รายการ order ของร้านและ `pagination` |
| GET Product orders | `http://localhost:5000/api/v1/products/PRODUCT_ID/orders?page=1&limit=20` | ไม่มี | `200`; รายการ order ของสินค้านี้และ `pagination` |

แทน `PRODUCT_ID` ด้วย **productId** จาก Create product

### POST Record order

- URL: `http://localhost:5000/api/v1/products/PRODUCT_ID/orders`
- Body:

```json
{
  "quantity": 2,
  "note": "ขายหน้าร้าน"
}
```

ผลที่คาดหวัง: `201`; `data.quantity` เป็น `2` และ `data.total` เท่ากับ `data.unitPrice × 2` จด `data._id` เป็น **orderId** แล้วเปิด GET Orders, GET Product orders และ GET Product by ID เพื่อตรวจรายการกับสต็อกที่ลดลง `note` ไม่ใส่ก็ได้

## 05 Error examples

สร้าง request แยกใน Folder นี้ แล้วเปลี่ยน Body หรือ Authorization ตามกรณี

| กรณี | วิธีส่ง | HTTP status ที่คาดหวัง |
| --- | --- | --- |
| ไม่มี token | `GET /api/v1/products` โดยเลือก No Auth | `401` |
| token ผิด | `GET /api/v1/products` โดยใช้ Bearer Token `invalid` | `401` |
| รหัสผ่านผิด | `POST /api/v1/login` ด้วยอีเมลถูก รหัสผ่านผิด | `401` |
| อีเมลซ้ำ | `POST /api/v1/register` ด้วยอีเมลที่สมัครแล้ว | `409` |
| Body ไม่ครบ | `POST /api/v1/products` โดยไม่ใส่ `price` | `400` |
| สต็อกติดลบ | `PUT /api/v1/products/PRODUCT_ID` ด้วย `{"stock":-1}` | `400` |
| สต็อกไม่พอ | `POST /api/v1/products/PRODUCT_ID/orders` ด้วย `quantity` มากกว่าสต็อก | `409` |
| ร้านเข้าหน้าแอดมิน | `GET /api/v1/shops` ด้วย shopToken | `403` |
| แอดมินเข้าหน้าร้าน | `GET /api/v1/products` ด้วย adminToken | `403` |
| ID ผิดรูปแบบ | `GET /api/v1/products/not-an-id` | `400` |
| limit เกิน | `GET /api/v1/products?limit=101` | `400` |
| URL ไม่มีในระบบ | `GET /api/v1/unknown` | `404` |

## ลำดับทดสอบที่แนะนำ

1. API info → Register shop → Login shop (ตรวจ `data.account.status` เป็น `pending`)
2. Login admin → Pending shops → Approve shop → Login shop อีกครั้ง (สถานะเป็น `approved`)
3. Create product → Products → Product by ID → Update product (รวมสต็อก)
4. Record order → Orders → Product orders → Product by ID เพื่อตรวจสต็อก
5. Archive product → Product orders อีกครั้ง → Error examples

หากทดสอบซ้ำ ให้ใช้อีเมลร้านใหม่และสร้างสินค้าใหม่ หรือ Login บัญชีร้านเดิมอีกครั้งเพื่อรับ token
