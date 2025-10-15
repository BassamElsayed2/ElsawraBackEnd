-- ============================================================
-- Create Delivery Fees Configuration Table
-- ============================================================

-- Drop table if exists
IF OBJECT_ID('delivery_fees_config', 'U') IS NOT NULL
  DROP TABLE delivery_fees_config;
GO

-- Create delivery fees configuration table
CREATE TABLE delivery_fees_config (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  min_distance_km DECIMAL(10, 2) NOT NULL, -- Minimum distance in KM
  max_distance_km DECIMAL(10, 2) NOT NULL, -- Maximum distance in KM
  fee DECIMAL(10, 2) NOT NULL, -- Delivery fee in EGP
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT chk_distance_range CHECK (min_distance_km < max_distance_km),
  CONSTRAINT chk_positive_fee CHECK (fee >= 0)
);
GO

-- Create index for faster lookups
CREATE INDEX idx_distance_range ON delivery_fees_config(min_distance_km, max_distance_km, is_active);
GO

-- Insert default delivery fee ranges
INSERT INTO delivery_fees_config (min_distance_km, max_distance_km, fee, is_active)
VALUES
  (0.0, 5.0, 15.00, 1),      -- 0-5 km: 15 EGP
  (5.0, 10.0, 25.00, 1),      -- 5-10 km: 25 EGP
  (10.0, 15.0, 35.00, 1),     -- 10-15 km: 35 EGP
  (15.0, 20.0, 50.00, 1),     -- 15-20 km: 50 EGP
  (20.0, 9999.0, 70.00, 1);   -- 20+ km: 70 EGP
GO

-- Create stored procedure to get delivery fee by distance
CREATE OR ALTER PROCEDURE sp_GetDeliveryFee
  @distance_km DECIMAL(10, 2)
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT TOP 1 
    id,
    min_distance_km,
    max_distance_km,
    fee
  FROM delivery_fees_config
  WHERE is_active = 1
    AND @distance_km >= min_distance_km
    AND @distance_km < max_distance_km
  ORDER BY min_distance_km;
END;
GO

-- Select to verify
SELECT * FROM delivery_fees_config ORDER BY min_distance_km;
GO

