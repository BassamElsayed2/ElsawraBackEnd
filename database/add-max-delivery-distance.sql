-- ============================================================
-- Add max_delivery_distance_km to delivery_fees_config
-- ============================================================

-- Add max_delivery_distance_km column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('delivery_fees_config') 
    AND name = 'max_delivery_distance_km'
)
BEGIN
    -- Add column to store maximum delivery distance (0 means unlimited)
    ALTER TABLE delivery_fees_config 
    ADD max_delivery_distance_km DECIMAL(10, 2) DEFAULT 0;
    
    PRINT 'Added max_delivery_distance_km column to delivery_fees_config';
    
    -- Set a default max distance of 30 km (can be changed by admin)
    UPDATE delivery_fees_config 
    SET max_delivery_distance_km = 30.0 
    WHERE max_delivery_distance_km = 0;
    
    PRINT 'Set default max delivery distance to 30 km';
END
ELSE
BEGIN
    PRINT 'max_delivery_distance_km column already exists';
END
GO

-- Create stored procedure to check if delivery is available for a distance
CREATE OR ALTER PROCEDURE sp_CheckDeliveryAvailability
  @distance_km DECIMAL(10, 2)
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Get max delivery distance (take the maximum from active configs)
  DECLARE @max_distance DECIMAL(10, 2);
  
  SELECT @max_distance = MAX(max_delivery_distance_km)
  FROM delivery_fees_config
  WHERE is_active = 1;
  
  -- If max_distance is 0, it means unlimited
  IF @max_distance = 0 OR @distance_km <= @max_distance
  BEGIN
    SELECT 1 AS is_available, @max_distance AS max_delivery_distance_km;
  END
  ELSE
  BEGIN
    SELECT 0 AS is_available, @max_distance AS max_delivery_distance_km;
  END
END;
GO

-- Select to verify
SELECT * FROM delivery_fees_config;
GO

PRINT 'Max delivery distance setup completed successfully';
GO

