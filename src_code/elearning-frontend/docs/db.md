
Enum "users_role_enum" {
  "ADMIN"
  "TEACHER"
  "STUDENT"
}

Enum "users_status_enum" {
  "ACTIVE"
  "INACTIVE"
  "SUSPENDED"
}

Enum "teacher_profiles_status_enum" {
  "PENDING"
  "APPROVED"
  "REJECTED"
  "SUSPENDED"
}

Enum "courses_status_enum" {
  "DRAFT"
  "PENDING_REVIEW"
  "APPROVED"
  "REJECTED"
  "PUBLISHED"
}

Enum "episodes_type_enum" {
  "VIDEO"
  "QUIZ"
}

Enum "enrollments_status_enum" {
  "ACTIVE"
  "CANCELLED"
  "COMPLETED"
}

Enum "exams_status_enum" {
  "DRAFT"
  "PENDING_REVIEW"
  "APPROVED"
  "LIVE"
  "CLOSED"
}

Table "users" {
  "id" BIGINT [pk, increment]
  "email" VARCHAR(255) [unique, not null]
  "password_hash" VARCHAR(255) [not null]
  "full_name" VARCHAR(255) [not null]
  "phone" VARCHAR(20)
  "avatar_url" TEXT
  "role" users_role_enum [not null]
  "status" users_status_enum [default: 'ACTIVE']
  "created_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  "updated_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Table "teacher_profiles" {
  "user_id" BIGINT [pk]
  "id_card_front" TEXT
  "id_card_back" TEXT
  "teaching_certificate_url" TEXT
  "status" teacher_profiles_status_enum [default: 'PENDING']
  "rejection_reason" TEXT
  "submitted_at" TIMESTAMP
  "reviewed_at" TIMESTAMP
}

Table "subjects" {
  "id" BIGINT [pk, increment]
  "name" VARCHAR(100) [unique, not null]
}

Table "grade_levels" {
  "id" BIGINT [pk, increment]
  "name" VARCHAR(50) [unique, not null]
}

Table "courses" {
  "id" BIGINT [pk, increment]
  "teacher_id" BIGINT [not null]
  "title" VARCHAR(255) [not null]
  "summary" TEXT
  "thumbnail_url" TEXT
  "subject_id" BIGINT
  "grade_level_id" BIGINT
  "status" courses_status_enum [default: 'DRAFT']
  "rejection_reason" TEXT
  "submitted_at" TIMESTAMP
  "approved_at" TIMESTAMP
  "created_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  "updated_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Table "chapters" {
  "id" BIGINT [pk, increment]
  "course_id" BIGINT [not null]
  "title" VARCHAR(255) [not null]
  "order" INT [not null]

  Indexes {
    (course_id, order) [unique, name: "unique_order_per_course"]
  }
}

Table "episodes" {
  "id" BIGINT [pk, increment]
  "chapter_id" BIGINT [not null]
  "title" VARCHAR(255) [not null]
  "type" episodes_type_enum [not null]
  "video_url" TEXT
  "duration_seconds" INT
  "order" INT [not null]
  "created_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]

  Indexes {
    (chapter_id, order) [unique, name: "unique_order_per_chapter"]
  }
}

Table "quiz_questions" {
  "id" BIGINT [pk, increment]
  "episode_id" BIGINT [not null]
  "content" TEXT [not null]
  "image_url" TEXT
  "order" INT [not null]

  Indexes {
    (episode_id, order) [unique, name: "unique_order_per_episode"]
  }
}

Table "quiz_answers" {
  "id" BIGINT [pk, increment]
  "question_id" BIGINT [not null]
  "content" VARCHAR(500) [not null]
  "is_correct" BOOLEAN [not null, default: FALSE]
}

Table "quiz_attempts" {
  "id" BIGINT [pk, increment]
  "episode_id" BIGINT [not null]
  "student_id" BIGINT [not null]
  "submitted_at" TIMESTAMP
  "score" DECIMAL(5,2)
  "responses_json" JSON

  Indexes {
    (student_id, episode_id) [unique, name: "unique_student_quiz"]
  }
}

Table "course_materials" {
  "id" BIGINT [pk, increment]
  "course_id" BIGINT [not null]
  "title" VARCHAR(255) [not null]
  "file_url" TEXT [not null]
  "file_size_kb" INT
  "uploaded_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Table "enrollments" {
  "id" BIGINT [pk, increment]
  "student_id" BIGINT [not null]
  "course_id" BIGINT [not null]
  "status" enrollments_status_enum [default: 'ACTIVE']
  "enrolled_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  "cancelled_at" TIMESTAMP
  "completed_at" TIMESTAMP
  "progress_percentage" DECIMAL(5,2) [default: 0.00]
  "last_episode_id" BIGINT

  Indexes {
    (student_id, course_id) [unique, name: "unique_student_course"]
  }
}

Table "episode_completions" {
  "enrollment_id" BIGINT [not null]
  "episode_id" BIGINT [not null]
  "completed_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]

  Indexes {
    (enrollment_id, episode_id) [pk]
  }
}

Table "exams" {
  "id" BIGINT [pk, increment]
  "teacher_id" BIGINT [not null]
  "title" VARCHAR(255) [not null]
  "start_time" TIMESTAMP [not null]
  "end_time" TIMESTAMP [not null]
  "duration_minutes" INT [not null]
  "status" exams_status_enum [default: 'DRAFT']
  "rejection_reason" TEXT
  "submitted_at" TIMESTAMP
  "approved_at" TIMESTAMP
  "created_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Table "exam_questions" {
  "id" BIGINT [pk, increment]
  "exam_id" BIGINT [not null]
  "content" TEXT [not null]
  "image_url" TEXT
  "order" INT [not null]
}

Table "exam_answers" {
  "id" BIGINT [pk, increment]
  "question_id" BIGINT [not null]
  "content" VARCHAR(500) [not null]
  "is_correct" BOOLEAN [not null, default: FALSE]
}

Table "exam_attempts" {
  "id" BIGINT [pk, increment]
  "exam_id" BIGINT [not null]
  "student_id" BIGINT [not null]
  "started_at" TIMESTAMP [not null]
  "submitted_at" TIMESTAMP
  "score" DECIMAL(5,2)
  "time_spent_seconds" INT
  "response_json" JSON

  Indexes {
    (student_id, exam_id) [unique, name: "unique_student_exam"]
  }
}

// Table "exam_responses" {
//   "attempt_id" BIGINT [not null]
//   "question_id" BIGINT [not null]
//   "selected_answer_id" BIGINT [not null]
//   "responses_json" JSON

//   Indexes {
//     (attempt_id, question_id) [pk]
//   }
// }

Table certificates {
  id bigint [pk, increment]
  enrollment_id bigint [not null, unique]
  certificate_url text [not null]
  issued_at timestamp [default: `CURRENT_TIMESTAMP`]
}


// Table "admin_audit_logs" {
//   "id" BIGINT [pk, increment]
//   "admin_id" BIGINT [not null]
//   "action" VARCHAR(100) [not null]
//   "target_type" VARCHAR(50) [not null]
//   "target_id" BIGINT [not null]
//   "details" JSON
//   "created_at" TIMESTAMP [default: `CURRENT_TIMESTAMP`]
// }

Ref:"users"."id" < "teacher_profiles"."user_id" [delete: cascade]

Ref:"users"."id" < "courses"."teacher_id"

Ref:"subjects"."id" < "courses"."subject_id"

Ref:"grade_levels"."id" < "courses"."grade_level_id"

Ref:"courses"."id" < "chapters"."course_id" [delete: cascade]

Ref:"chapters"."id" < "episodes"."chapter_id" [delete: cascade]

Ref:"episodes"."id" < "quiz_questions"."episode_id" [delete: cascade]

Ref:"quiz_questions"."id" < "quiz_answers"."question_id" [delete: cascade]

Ref:"episodes"."id" < "quiz_attempts"."episode_id"

Ref:"users"."id" < "quiz_attempts"."student_id"

// Ref:"quiz_attempts"."id" < "quiz_responses"."quiz_attempt_id" [delete: cascade]

// Ref:"quiz_questions"."id" < "quiz_responses"."quiz_question_id"

// Ref:"quiz_answers"."id" < "quiz_responses"."selected_answer_id"

Ref:"courses"."id" < "course_materials"."course_id" [delete: cascade]

Ref:"users"."id" < "enrollments"."student_id"

Ref:"courses"."id" < "enrollments"."course_id"

Ref:"episodes"."id" < "enrollments"."last_episode_id"

Ref:"enrollments"."id" < "episode_completions"."enrollment_id" [delete: cascade]

Ref:"episodes"."id" < "episode_completions"."episode_id" [delete: cascade]

Ref:"users"."id" < "exams"."teacher_id"

Ref:"exams"."id" < "exam_questions"."exam_id" [delete: cascade]

Ref:"exam_questions"."id" < "exam_answers"."question_id" [delete: cascade]

Ref:"exams"."id" < "exam_attempts"."exam_id"

// Ref:"users"."id" < "exam_attempts"."student_id"

// Ref:"exam_attempts"."id" < "exam_responses"."attempt_id" [delete: cascade]

// Ref:"exam_questions"."id" < "exam_responses"."question_id"

// Ref:"exam_answers"."id" < "exam_responses"."selected_answer_id"

Ref:"enrollments"."id" < "certificates"."enrollment_id" [delete: cascade]

// Ref:"users"."id" < "admin_audit_logs"."admin_id"
