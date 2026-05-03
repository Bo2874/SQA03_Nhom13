-- =============================================================================
-- ROLLBACK SCRIPT — E-Learning API Test Cleanup
-- =============================================================================
-- Convention: tất cả dữ liệu test do API_TestScript tạo ra đều có prefix:
--   - email user        : test_api_*@*
--   - tên course        : TEST_API_*
--   - tên subject       : TEST_API_*
--   - tên grade level   : TEST_API_*
--   - tên exam          : TEST_API_*
-- Chạy file này SAU khi chạy xong toàn bộ Postman Collection để dọn DB.
-- Cách chạy:
--   docker exec -i elearning-mysql mysql -uroot -p1234 elearning < cleanup.sql
-- HOẶC dán vào MySQL Workbench / DBeaver và execute.
-- =============================================================================

USE elearning;

-- Tắt FK check để xoá an toàn theo thứ tự bất kỳ
SET FOREIGN_KEY_CHECKS = 0;

-- Đếm trước khi xoá để biết phạm vi ảnh hưởng
SELECT 'BEFORE CLEANUP' AS phase;
SELECT COUNT(*) AS test_users  FROM users   WHERE email LIKE 'test_api_%';
SELECT COUNT(*) AS test_courses FROM courses WHERE title LIKE 'TEST_API_%';

-- 1. Xoá episode_completions thuộc enrollments của test users (qua bridge)
DELETE ec FROM episode_completions ec
INNER JOIN enrollments e ON ec.enrollment_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE u.email LIKE 'test_api_%';

-- 2. Xoá enrollments của test users (FK: user_id)
DELETE e FROM enrollments e
INNER JOIN users u ON e.user_id = u.id
WHERE u.email LIKE 'test_api_%';

-- 3. Xoá quiz attempts của test users (FK: user_id)
DELETE qa FROM quiz_attempts qa
INNER JOIN users u ON qa.user_id = u.id
WHERE u.email LIKE 'test_api_%';

-- 4. Xoá exam attempts của test users (FK: user_id)
DELETE ea FROM exam_attempts ea
INNER JOIN users u ON ea.user_id = u.id
WHERE u.email LIKE 'test_api_%';

-- 5. Xoá test exams (do test teachers tạo)
DELETE FROM exams WHERE title LIKE 'TEST_API_%';

-- 6. Xoá test courses & các thực thể con (chapters, episodes, quiz_questions, materials, etc.)
--    (FK check đã tắt nên có thể xoá course trực tiếp; tuỳ thuộc cascade của entity)
DELETE FROM courses WHERE title LIKE 'TEST_API_%';

-- 7. Xoá test subjects
DELETE FROM subjects WHERE name LIKE 'TEST_API_%';

-- 8. Xoá test grade levels
DELETE FROM grade_levels WHERE name LIKE 'TEST_API_%';

-- 9. Xoá Zoom meetings của test teachers (FK: teacher_id)
DELETE z FROM zoom_meetings z
INNER JOIN users u ON z.teacher_id = u.id
WHERE u.email LIKE 'test_api_%';

-- 10. Cuối cùng — xoá test users
DELETE FROM users WHERE email LIKE 'test_api_%';

SET FOREIGN_KEY_CHECKS = 1;

-- Verify
SELECT 'AFTER CLEANUP' AS phase;
SELECT COUNT(*) AS remaining_test_users   FROM users   WHERE email LIKE 'test_api_%';
SELECT COUNT(*) AS remaining_test_courses FROM courses WHERE title LIKE 'TEST_API_%';
