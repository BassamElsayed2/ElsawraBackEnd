-- Fix addresses table column names to match backend expectations
-- Rename lat to latitude
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('addresses') AND name = 'lat')
BEGIN
    EXEC sp_rename 'addresses.lat', 'latitude', 'COLUMN';
    PRINT 'Renamed lat to latitude';
END

-- Rename lng to longitude  
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('addresses') AND name = 'lng')
BEGIN
    EXEC sp_rename 'addresses.lng', 'longitude', 'COLUMN';
    PRINT 'Renamed lng to longitude';
END

-- Rename name to title
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('addresses') AND name = 'name')
BEGIN
    EXEC sp_rename 'addresses.name', 'title', 'COLUMN';
    PRINT 'Renamed name to title';
END

-- Drop phone column if it exists (not used in backend)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('addresses') AND name = 'phone')
BEGIN
    ALTER TABLE addresses DROP COLUMN phone;
    PRINT 'Dropped phone column';
END

PRINT 'Addresses table column fixes completed successfully';
