CREATE TABLE `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `avatar_url` TEXT,
  `role` ENUM ('ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
  `status` ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `teacher_profiles` (
  `user_id` BIGINT PRIMARY KEY,
  `id_card_front` TEXT,
  `id_card_back` TEXT,
  `teaching_certificate_url` TEXT,
  `status` ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') DEFAULT 'PENDING',
  `rejection_reason` TEXT,
  `submitted_at` TIMESTAMP,
  `reviewed_at` TIMESTAMP
);

CREATE TABLE `subjects` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE `grade_levels` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE `courses` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT,
  `thumbnail_url` TEXT,
  `subject_id` BIGINT,
  `grade_level_id` BIGINT,
  `status` ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT',
  `rejection_reason` TEXT,
  `submitted_at` TIMESTAMP,
  `approved_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `chapters` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `course_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `order` INT NOT NULL
);

CREATE TABLE `episodes` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `chapter_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `type` ENUM ('VIDEO', 'QUIZ') NOT NULL,
  `video_url` TEXT,
  `duration_seconds` INT,
  `order` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `quiz_questions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `episode_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` TEXT,
  `order` INT NOT NULL
);

CREATE TABLE `quiz_answers` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `question_id` BIGINT NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `order` INT NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE `quiz_attempts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `episode_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `submitted_at` TIMESTAMP,
  `score` DECIMAL(5,2),
  `responses_json` JSON
);

CREATE TABLE `course_materials` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `course_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_url` TEXT NOT NULL,
  `file_size_kb` INT,
  `uploaded_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `enrollments` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL,
  `course_id` BIGINT NOT NULL,
  `status` ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED') DEFAULT 'ACTIVE',
  `enrolled_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `cancelled_at` TIMESTAMP,
  `completed_at` TIMESTAMP,
  `progress_percentage` DECIMAL(5,2) DEFAULT 0,
  `last_episode_id` BIGINT
);

CREATE TABLE `episode_completions` (
  `enrollment_id` BIGINT NOT NULL,
  `episode_id` BIGINT NOT NULL,
  `completed_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`enrollment_id`, `episode_id`)
);

CREATE TABLE `exams` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NOT NULL,
  `duration_minutes` INT NOT NULL,
  `status` ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'LIVE', 'CLOSED') DEFAULT 'DRAFT',
  `rejection_reason` TEXT,
  `submitted_at` TIMESTAMP,
  `approved_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `exam_questions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `exam_id` BIGINT NOT NULL,
  `content` TEXT NOT NULL,
  `image_url` TEXT,
  `order` INT NOT NULL
);

CREATE TABLE `exam_answers` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `question_id` BIGINT NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE `exam_attempts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `exam_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `started_at` TIMESTAMP NOT NULL,
  `submitted_at` TIMESTAMP,
  `score` DECIMAL(5,2),
   `responses_json` JSON,
  `time_spent_seconds` INT
);

CREATE TABLE `certificates` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `enrollment_id` bigint UNIQUE NOT NULL,
  `certificate_url` text NOT NULL,
  `issued_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE UNIQUE INDEX `unique_order_per_course` ON `chapters` (`course_id`, `order`);

CREATE UNIQUE INDEX `unique_order_per_chapter` ON `episodes` (`chapter_id`, `order`);

CREATE UNIQUE INDEX `unique_order_per_episode` ON `quiz_questions` (`episode_id`, `order`);

CREATE UNIQUE INDEX `unique_student_quiz` ON `quiz_attempts` (`student_id`, `episode_id`);

CREATE UNIQUE INDEX `unique_student_course` ON `enrollments` (`student_id`, `course_id`);

CREATE UNIQUE INDEX `unique_student_exam` ON `exam_attempts` (`student_id`, `exam_id`);

ALTER TABLE `teacher_profiles` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `courses` ADD FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`);

ALTER TABLE `courses` ADD FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

ALTER TABLE `courses` ADD FOREIGN KEY (`grade_level_id`) REFERENCES `grade_levels` (`id`);

ALTER TABLE `chapters` ADD FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

ALTER TABLE `episodes` ADD FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE;

ALTER TABLE `quiz_questions` ADD FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE;

ALTER TABLE `quiz_answers` ADD FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

ALTER TABLE `quiz_attempts` ADD FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`);

ALTER TABLE `quiz_attempts` ADD FOREIGN KEY (`student_id`) REFERENCES `users` (`id`);

ALTER TABLE `course_materials` ADD FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

ALTER TABLE `enrollments` ADD FOREIGN KEY (`student_id`) REFERENCES `users` (`id`);

ALTER TABLE `enrollments` ADD FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);

ALTER TABLE `enrollments` ADD FOREIGN KEY (`last_episode_id`) REFERENCES `episodes` (`id`);

ALTER TABLE `episode_completions` ADD FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE;

ALTER TABLE `episode_completions` ADD FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE;

ALTER TABLE `exams` ADD FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`);

ALTER TABLE `exam_questions` ADD FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE;

ALTER TABLE `exam_answers` ADD FOREIGN KEY (`question_id`) REFERENCES `exam_questions` (`id`) ON DELETE CASCADE;

ALTER TABLE `exam_attempts` ADD FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`);

ALTER TABLE `certificates` ADD FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE;