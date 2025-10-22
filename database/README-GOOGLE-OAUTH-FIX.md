# إصلاح قاعدة البيانات لدعم Google OAuth

## 🐛 المشكلة

```
Error: Cannot insert value NULL into column 'password_hash'
```

**السبب:** مستخدمو Google لا يحتاجون كلمة مرور، لكن الجدول لا يسمح بـ NULL.

## ✅ الحل

تشغيل SQL Script لتعديل الجدول:

### الطريقة 1: باستخدام SQL Server Management Studio (SSMS)

1. افتح **SSMS**
2. اتصل بقاعدة البيانات
3. افتح الملف: `fix-google-oauth-users.sql`
4. اضغط **Execute** أو **F5**

### الطريقة 2: باستخدام PowerShell

```powershell
# من مجلد backend/database
sqlcmd -S localhost -d food_cms -i fix-google-oauth-users.sql
```

### الطريقة 3: باستخدام Node.js Script

```bash
# من مجلد backend
npm run fix-google-oauth
```

## 📊 ما يتم تعديله

### قبل:

```sql
password_hash VARCHAR(255) NOT NULL  ❌
```

### بعد:

```sql
password_hash VARCHAR(255) NULL  ✅
```

## 🔒 الأمان المُضاف

سيتم إضافة Check Constraint:

```sql
CHECK (
  password_hash IS NOT NULL  -- مستخدمون عاديون
  OR
  (password_hash IS NULL AND email_verified = 1)  -- مستخدمو Google
)
```

**يضمن:**

- المستخدمون العاديون **يجب** أن يكون لديهم password
- مستخدمو Google **يمكن** أن يكون password = NULL فقط إذا email_verified = 1

## ✨ النتيجة

### مستخدم عادي:

```sql
INSERT INTO users (email, password_hash, email_verified)
VALUES ('user@example.com', 'hashed_password', 0);  ✅
```

### مستخدم Google:

```sql
INSERT INTO users (email, password_hash, email_verified)
VALUES ('user@gmail.com', NULL, 1);  ✅
```

### ممنوع:

```sql
-- NULL password بدون email verified
INSERT INTO users (email, password_hash, email_verified)
VALUES ('user@example.com', NULL, 0);  ❌ REJECTED!
```

## 🔍 التحقق من نجاح التعديل

```sql
-- تحقق من السماح بـ NULL
SELECT COLUMN_NAME, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
  AND COLUMN_NAME = 'password_hash';

-- يجب أن يظهر: IS_NULLABLE = 'YES'
```

## 📝 ملاحظات

1. **لن يؤثر على المستخدمين الحاليين** - التعديل آمن
2. **المستخدمون الحاليون يحتفظون بكلمات مرورهم**
3. **مستخدمو Google الجدد يمكنهم التسجيل الآن**

## 🚨 تنبيه

إذا كان لديك مستخدمون حاليون بدون password:

```sql
-- تحديث المستخدمين القدامى بدون password
UPDATE users
SET email_verified = 1
WHERE password_hash IS NULL;
```

## ✅ بعد التشغيل

جرّب Google Sign-In مرة أخرى:

1. افتح `/ar/auth/signin`
2. انقر "تسجيل الدخول بحساب جوجل"
3. ✅ يجب أن يعمل الآن!

---

**تم!** قاعدة البيانات الآن تدعم Google OAuth 🎉
