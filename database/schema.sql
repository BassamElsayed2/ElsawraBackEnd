-- ============================================================
-- Food CMS Database Schema for SQL Server
-- تحويل من PostgreSQL إلى SQL Server T-SQL
-- ============================================================
-- Date: October 12, 2025
-- Version: 1.0
-- ============================================================

USE elsawraDb;
GO

-- ============================================================
-- 1. Users Table (Better Auth)
-- ============================================================

CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    email_verified BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================
-- 2. Sessions Table
-- ============================================================

CREATE TABLE sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token NVARCHAR(500) UNIQUE NOT NULL,
    device_name NVARCHAR(255),
    device_type NVARCHAR(50), -- 'mobile', 'tablet', 'desktop'
    browser NVARCHAR(100),
    os NVARCHAR(100),
    ip_address NVARCHAR(50),
    location NVARCHAR(MAX), -- JSON
    is_current BIT DEFAULT 0,
    last_activity DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity DESC);

-- ============================================================
-- 3. Profiles Table
-- ============================================================

CREATE TABLE profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    phone_verified BIT DEFAULT 0,
    mfa_enabled BIT DEFAULT 0,
    last_password_change DATETIME2 DEFAULT GETDATE(),
    password_expires_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- ============================================================
-- 4. Admin Profiles Table
-- ============================================================

CREATE TABLE admin_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'manager')),
    permissions NVARCHAR(MAX), -- JSON array of permissions
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_admin_profiles_user_id ON admin_profiles(user_id);

-- ============================================================
-- 5. Security Logs Table
-- ============================================================

CREATE TABLE security_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_type NVARCHAR(50) NOT NULL CHECK (event_type IN (
        'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 
        'SIGNUP_SUCCESS', 'SIGNUP_FAILED',
        'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'PASSWORD_RESET_FAILED',
        'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
        'SUSPICIOUS_ACTIVITY', 'SESSION_EXPIRED',
        'MFA_ENABLED', 'MFA_DISABLED', 'MFA_VERIFIED', 'MFA_FAILED'
    )),
    user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
    email NVARCHAR(255),
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    location NVARCHAR(MAX), -- JSON
    details NVARCHAR(MAX), -- JSON
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_email ON security_logs(email);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);

-- ============================================================
-- 6. OTP Codes Table
-- ============================================================

CREATE TABLE otp_codes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    phone NVARCHAR(20) NOT NULL,
    code NVARCHAR(10) NOT NULL,
    type NVARCHAR(50) NOT NULL CHECK (type IN ('phone_verification', 'password_reset', 'login', 'order_confirmation')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    expires_at DATETIME2 NOT NULL,
    verified_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_otp_codes_type ON otp_codes(type);

-- ============================================================
-- 7. Password History Table
-- ============================================================

CREATE TABLE password_history (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at DESC);

-- ============================================================
-- 8. Account Lockouts Table
-- ============================================================

CREATE TABLE account_lockouts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    identifier NVARCHAR(255) NOT NULL UNIQUE, -- email or phone
    failed_attempts INT DEFAULT 0,
    locked_at DATETIME2,
    locked_until DATETIME2,
    last_attempt_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_account_lockouts_identifier ON account_lockouts(identifier);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- ============================================================
-- 9. Categories Table
-- ============================================================

CREATE TABLE categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_ar NVARCHAR(255) NOT NULL,
    name_en NVARCHAR(255) NOT NULL,
    description_ar NVARCHAR(MAX),
    description_en NVARCHAR(MAX),
    image_url NVARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- ============================================================
-- 10. Products Table
-- ============================================================

CREATE TABLE products (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255) NOT NULL,
    title_en NVARCHAR(255) NOT NULL,
    description_ar NVARCHAR(MAX),
    description_en NVARCHAR(MAX),
    category_id UNIQUEIDENTIFIER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url NVARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- ============================================================
-- 11. Product Types Table
-- ============================================================

CREATE TABLE product_types (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name_ar NVARCHAR(255) NOT NULL,
    name_en NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_product_types_product_id ON product_types(product_id);

-- ============================================================
-- 12. Product Sizes Table
-- ============================================================

CREATE TABLE product_sizes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    type_id UNIQUEIDENTIFIER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    size_ar NVARCHAR(100) NOT NULL,
    size_en NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    offer_price DECIMAL(10, 2),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_product_sizes_type_id ON product_sizes(type_id);

-- ============================================================
-- 13. Branches Table
-- ============================================================

CREATE TABLE branches (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_ar NVARCHAR(255) NOT NULL,
    name_en NVARCHAR(255) NOT NULL,
    address_ar NVARCHAR(500) NOT NULL,
    address_en NVARCHAR(500) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    working_hours NVARCHAR(MAX), -- JSON
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_branches_is_active ON branches(is_active);
CREATE INDEX idx_branches_lat_lng ON branches(lat, lng);

-- ============================================================
-- 14. Addresses Table
-- ============================================================

CREATE TABLE addresses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    street NVARCHAR(500) NOT NULL,
    building NVARCHAR(100) NOT NULL,
    floor NVARCHAR(50),
    apartment NVARCHAR(50),
    area NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    is_default BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- ============================================================
-- 15. Orders Table
-- ============================================================

CREATE TABLE orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    address_id UNIQUEIDENTIFIER REFERENCES addresses(id) ON DELETE NO ACTION,
    delivery_type NVARCHAR(20) NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
    branch_id UNIQUEIDENTIFIER REFERENCES branches(id) ON DELETE NO ACTION,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'ready', 
        'delivering', 'delivered', 'cancelled'
    )),
    items NVARCHAR(MAX) NOT NULL, -- JSON
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    notes NVARCHAR(MAX),
    payment_method NVARCHAR(50) DEFAULT 'cash', -- 'cash', 'card', 'wallet'
    payment_status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================================
-- 16. Offers Table
-- ============================================================

CREATE TABLE offers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255) NOT NULL,
    title_en NVARCHAR(255) NOT NULL,
    description_ar NVARCHAR(MAX),
    description_en NVARCHAR(MAX),
    image_url NVARCHAR(500),
    discount_type NVARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2),
    start_date DATETIME2,
    end_date DATETIME2,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_offers_is_active ON offers(is_active);
CREATE INDEX idx_offers_dates ON offers(start_date, end_date);

-- ============================================================
-- 17. Combo Offers Table
-- ============================================================

CREATE TABLE combo_offers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255) NOT NULL,
    title_en NVARCHAR(255) NOT NULL,
    description_ar NVARCHAR(MAX),
    description_en NVARCHAR(MAX),
    image_url NVARCHAR(500),
    products NVARCHAR(MAX), -- JSON array of product IDs
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_combo_offers_is_active ON combo_offers(is_active);

-- ============================================================
-- 18. Gallery Table
-- ============================================================

CREATE TABLE gallery (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255),
    title_en NVARCHAR(255),
    image_url NVARCHAR(500) NOT NULL,
    category NVARCHAR(100), -- 'food', 'restaurant', 'events'
    display_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_gallery_category ON gallery(category);
CREATE INDEX idx_gallery_display_order ON gallery(display_order);

-- ============================================================
-- 19. News Table
-- ============================================================

CREATE TABLE news (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255) NOT NULL,
    title_en NVARCHAR(255) NOT NULL,
    content_ar NVARCHAR(MAX) NOT NULL,
    content_en NVARCHAR(MAX) NOT NULL,
    image_url NVARCHAR(500),
    published BIT DEFAULT 0,
    published_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_news_published ON news(published);
CREATE INDEX idx_news_published_at ON news(published_at DESC);

-- ============================================================
-- 20. About Us Table
-- ============================================================

CREATE TABLE about_us (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title_ar NVARCHAR(255) NOT NULL,
    title_en NVARCHAR(255) NOT NULL,
    content_ar NVARCHAR(MAX) NOT NULL,
    content_en NVARCHAR(MAX) NOT NULL,
    mission_ar NVARCHAR(MAX),
    mission_en NVARCHAR(MAX),
    vision_ar NVARCHAR(MAX),
    vision_en NVARCHAR(MAX),
    values_ar NVARCHAR(MAX),
    values_en NVARCHAR(MAX),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- 21. Customer Feedback Table
-- ============================================================

CREATE TABLE customer_feedback (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER REFERENCES orders(id) ON DELETE CASCADE,
    user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(MAX),
    food_quality INT CHECK (food_quality BETWEEN 1 AND 5),
    service_quality INT CHECK (service_quality BETWEEN 1 AND 5),
    delivery_speed INT CHECK (delivery_speed BETWEEN 1 AND 5),
    is_published BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_customer_feedback_order_id ON customer_feedback(order_id);
CREATE INDEX idx_customer_feedback_user_id ON customer_feedback(user_id);
CREATE INDEX idx_customer_feedback_rating ON customer_feedback(rating);
CREATE INDEX idx_customer_feedback_is_published ON customer_feedback(is_published);

-- ============================================================
-- 22. Delivery Zones Table
-- ============================================================

CREATE TABLE delivery_zones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    branch_id UNIQUEIDENTIFIER REFERENCES branches(id) ON DELETE CASCADE,
    area_name NVARCHAR(200) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    estimated_time INT NOT NULL, -- minutes
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_delivery_zones_branch_id ON delivery_zones(branch_id);
CREATE INDEX idx_delivery_zones_is_active ON delivery_zones(is_active);

-- ============================================================
-- 23. Geocoding Cache Table (لتقليل Google Maps requests)
-- ============================================================

CREATE TABLE geocoding_cache (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    address NVARCHAR(500) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    formatted_address NVARCHAR(500),
    hits INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_geocoding_cache_address ON geocoding_cache(address);

-- ============================================================
-- 24. QR Codes Table (for branches)
-- ============================================================

CREATE TABLE branch_qr_codes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    branch_id UNIQUEIDENTIFIER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    qr_code_url NVARCHAR(500) NOT NULL,
    table_number NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_branch_qr_codes_branch_id ON branch_qr_codes(branch_id);

-- ============================================================
-- End of Schema
-- ============================================================

PRINT 'Database schema created successfully!';
GO

