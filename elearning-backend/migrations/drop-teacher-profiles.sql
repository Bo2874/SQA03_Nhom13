-- Migration: Drop teacher_profiles table
-- Date: 2024-12-15
-- Description: Remove teacher verification system. Teachers are now created directly by Admin.

-- Step 1: Backup existing data (optional, comment out if not needed)
CREATE TABLE IF NOT EXISTS teacher_profiles_backup AS
SELECT * FROM teacher_profiles;

-- Step 2: Drop foreign key constraints
ALTER TABLE teacher_profiles DROP FOREIGN KEY IF EXISTS `fk_teacher_profiles_user`;
ALTER TABLE teacher_profiles DROP FOREIGN KEY IF EXISTS `teacher_profiles_ibfk_1`;

-- Step 3: Drop the table
DROP TABLE IF EXISTS teacher_profiles;

-- Step 4: Verify
-- You can verify by running: SHOW TABLES LIKE 'teacher_profiles';
-- Should return empty result

-- Notes:
-- - All teachers with role=TEACHER in users table will continue to work
-- - No data loss for actual teacher accounts
-- - Only verification data (CCCD, certificates) is removed
-- - Teachers can now be created directly by admin through /api/v1/teachers endpoint
