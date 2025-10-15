-- ========================================
-- تحديث روابط الصور من localhost إلى elsawra.net
-- ========================================

-- تحديث صور الـ Admin Profiles
UPDATE admin_profiles
SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:5000%';

UPDATE admin_profiles
SET image_url = REPLACE(image_url, 'http://localhost:4015', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:4015%';

-- تحديث صور الـ Branches
UPDATE branches
SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:5000%';

UPDATE branches
SET image_url = REPLACE(image_url, 'http://localhost:4015', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:4015%';

-- تحديث صور الـ Products
UPDATE products
SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:5000%';

UPDATE products
SET image_url = REPLACE(image_url, 'http://localhost:4015', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:4015%';

-- تحديث صور الـ Offers
UPDATE offers
SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:5000%';

UPDATE offers
SET image_url = REPLACE(image_url, 'http://localhost:4015', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:4015%';

-- تحديث صور الـ Combo Offers
UPDATE combo_offers
SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:5000%';

UPDATE combo_offers
SET image_url = REPLACE(image_url, 'http://localhost:4015', 'https://elsawra.net')
WHERE image_url LIKE 'http://localhost:4015%';

-- عرض عدد الصفوف المُحدّثة
SELECT 
    'admin_profiles' AS table_name,
    COUNT(*) AS count
FROM admin_profiles
WHERE image_url LIKE '%elsawra.net%'
UNION ALL
SELECT 
    'branches' AS table_name,
    COUNT(*) AS count
FROM branches
WHERE image_url LIKE '%elsawra.net%'
UNION ALL
SELECT 
    'products' AS table_name,
    COUNT(*) AS count
FROM products
WHERE image_url LIKE '%elsawra.net%'
UNION ALL
SELECT 
    'offers' AS table_name,
    COUNT(*) AS count
FROM offers
WHERE image_url LIKE '%elsawra.net%'
UNION ALL
SELECT 
    'combo_offers' AS table_name,
    COUNT(*) AS count
FROM combo_offers
WHERE image_url LIKE '%elsawra.net%';

