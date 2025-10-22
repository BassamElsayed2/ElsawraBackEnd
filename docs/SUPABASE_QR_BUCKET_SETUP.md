# إعداد QR Codes على Supabase 🚀

## نظرة سريعة

تم تحديث نظام QR Code لرفع الصور على Supabase بدلاً من التخزين المحلي.

**اسم الـ Bucket:** `QrImages`

---

## الخطوات المطلوبة

### 1. إنشاء Bucket في Supabase

1. افتح لوحة تحكم Supabase الخاصة بك
2. اذهب إلى **Storage** من القائمة الجانبية
3. اضغط على **New bucket**
4. املأ البيانات التالية:

   - **Name**: `QrImages`
   - **Public bucket**: ✅ (يجب تفعيلها)
   - **File size limit**: 5 MB (أو حسب الحاجة)
   - **Allowed MIME types**: `image/png`

5. اضغط **Save**

### 2. إعداد Policies للوصول

بعد إنشاء الـ bucket، يجب إعداد policies للسماح بالقراءة العامة:

#### سياسة القراءة العامة (Public Read)

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'QrImages');
```

#### سياسة الكتابة للمصرح لهم (Authenticated Write)

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'QrImages');
```

#### سياسة الحذف للمصرح لهم (Authenticated Delete)

```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'QrImages');
```

### 3. التحقق من Environment Variables

تأكد من وجود المتغيرات التالية في ملف `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **مهم**: استخدم `SUPABASE_SERVICE_ROLE_KEY` وليس `SUPABASE_ANON_KEY` لأننا نحتاج صلاحيات كاملة للرفع والحذف.

### 4. اختبار الإعداد

بعد إكمال الخطوات السابقة، يمكنك اختبار النظام:

1. قم بتشغيل الـ backend:

   ```bash
   cd backend
   npm run dev
   ```

2. افتح الـ dashboard وانتقل إلى صفحة الفروع
3. حاول إنشاء QR Code لأحد الفروع
4. يجب أن يتم رفع الصورة على Supabase بنجاح

### 5. التحقق من الصور

- افتح Supabase Dashboard
- اذهب إلى **Storage** > **QrImages**
- يجب أن تشاهد الصور المرفوعة بأسماء مثل: `qr-{branchId}-{timestamp}-{random}.png`

## ملاحظات

- الصور القديمة المخزنة محلياً في `uploads/qrcodes/` لن تعمل بعد هذا التحديث
- يجب إعادة توليد QR codes للفروع الموجودة
- يمكنك حذف مجلد `uploads/qrcodes/` المحلي بعد التأكد من نجاح الترحيل

## ترحيل QR Codes الموجودة (اختياري)

إذا كان لديك QR codes موجودة في `uploads/qrcodes/`:

```bash
cd backend
node scripts/migrate-qr-to-supabase.js
```

السكريبت سيقوم بترحيل جميع الصور تلقائياً.

## الاستخدام

### من Dashboard:

1. اذهب إلى **Dashboard** > **Branches**
2. اختر فرع واضغط "Generate QR Code"
3. الصورة سترفع تلقائياً على Supabase ✨

### API Endpoints:

```javascript
POST /api/qrcode/generate/:branchId  // إنشاء QR Code
GET  /api/qrcode/:branchId           // جلب QR Code لفرع
GET  /api/qrcode/all                 // جلب جميع QR Codes
DELETE /api/qrcode/:branchId         // حذف QR Code
```

## استكشاف الأخطاء

### خطأ: "Failed to upload buffer: The resource already exists"

- **السبب:** الملف موجود مسبقاً في Supabase
- **الحل:** احذف QR code القديم وأعد إنشاءه

### خطأ: "Supabase configuration is missing"

- **السبب:** متغيرات البيئة غير موجودة
- **الحل:** تأكد من وجود `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` في `.env`

### خطأ: "new row violates row-level security policy"

- **السبب:** Policies غير مضبوطة بشكل صحيح
- **الحل:** تأكد من إضافة الـ policies المذكورة أعلاه

### الصور لا تظهر في Dashboard

- تحقق أن Bucket اسمه `QrImages` بالضبط
- تأكد أنه Public
- راجع Supabase Storage logs

## الفوائد

- ✅ الصور على CDN عالمي (أسرع)
- ✅ نسخ احتياطي تلقائي
- ✅ أمان أفضل وإدارة محسنة
- ✅ سهولة التوسع

---

**تم بنجاح! جميع QR codes الجديدة سترفع على Supabase.**
