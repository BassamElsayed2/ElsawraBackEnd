-- Fix branches table to use lat/lng instead of latitude/longitude
-- This script removes latitude and longitude columns if they exist
-- and ensures lat and lng are the standard coordinate columns

-- Drop latitude column if exists
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('branches') 
    AND name = 'latitude'
)
BEGIN
    -- If lat doesn't exist, rename latitude to lat
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('branches') 
        AND name = 'lat'
    )
    BEGIN
        EXEC sp_rename 'branches.latitude', 'lat', 'COLUMN';
        PRINT 'Renamed latitude to lat';
    END
    ELSE
    BEGIN
        -- If lat exists, just drop latitude
        ALTER TABLE branches DROP COLUMN latitude;
        PRINT 'Dropped latitude column (lat already exists)';
    END
END
ELSE
BEGIN
    PRINT 'latitude column does not exist';
END
GO

-- Drop longitude column if exists
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('branches') 
    AND name = 'longitude'
)
BEGIN
    -- If lng doesn't exist, rename longitude to lng
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('branches') 
        AND name = 'lng'
    )
    BEGIN
        EXEC sp_rename 'branches.longitude', 'lng', 'COLUMN';
        PRINT 'Renamed longitude to lng';
    END
    ELSE
    BEGIN
        -- If lng exists, just drop longitude
        ALTER TABLE branches DROP COLUMN longitude;
        PRINT 'Dropped longitude column (lng already exists)';
    END
END
ELSE
BEGIN
    PRINT 'longitude column does not exist';
END
GO

-- Ensure lat and lng columns exist with correct types
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('branches') 
    AND name = 'lat'
)
BEGIN
    ALTER TABLE branches ADD lat DECIMAL(10, 8) NULL;
    PRINT 'Added lat column';
END
ELSE
BEGIN
    PRINT 'lat column already exists';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('branches') 
    AND name = 'lng'
)
BEGIN
    ALTER TABLE branches ADD lng DECIMAL(11, 8) NULL;
    PRINT 'Added lng column';
END
ELSE
BEGIN
    PRINT 'lng column already exists';
END
GO

-- Create or recreate index for lat/lng
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_branches_lat_lng')
BEGIN
    DROP INDEX idx_branches_lat_lng ON branches;
    PRINT 'Dropped old lat/lng index';
END
GO

CREATE INDEX idx_branches_lat_lng ON branches(lat, lng);
PRINT 'Created lat/lng index';
GO

-- Drop old latitude/longitude index if exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_branches_latitude_longitude')
BEGIN
    DROP INDEX idx_branches_latitude_longitude ON branches;
    PRINT 'Dropped old latitude/longitude index';
END
GO

PRINT 'Branches coordinates fix completed - using lat/lng only';
GO

