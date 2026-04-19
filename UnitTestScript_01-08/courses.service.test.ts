import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { config } from "dotenv";
import { DataSource, QueryRunner, Repository } from "typeorm";
import * as entities from "../elearning-backend/src/entities";

import { CoursesService } from "../elearning-backend/src/modules/courses/courses.service";
import { CourseMapper } from "../elearning-backend/src/modules/courses/mapper/course.mapper";
import {
  Course,
  CourseStatus,
} from "../elearning-backend/src/entities/course.entity";
import { Chapter } from "../elearning-backend/src/entities/chapter.entity";
import {
  Episode,
  EpisodeType,
} from "../elearning-backend/src/entities/episode.entity";
import { QuizQuestion } from "../elearning-backend/src/entities/quiz-question.entity";
import { QuizAnswer } from "../elearning-backend/src/entities/quiz-answer.entity";
import { CourseMaterial } from "../elearning-backend/src/entities/course-material.entity";
import {
  User,
  UserRole,
  UserStatus,
} from "../elearning-backend/src/entities/user.entity";
import { Subject } from "../elearning-backend/src/entities/subject.entity";
import { GradeLevel } from "../elearning-backend/src/entities/grade-level.entity";
import { Enrollment } from "../elearning-backend/src/entities/enrollment.entity";

import { CreateCourseDto } from "../elearning-backend/src/modules/courses/dto/create-course.dto";
import {
  CourseStatusByAdmin,
  UpdateCourseByAdminDto,
} from "../elearning-backend/src/modules/courses/dto/update-course-by-admin.dto";
import {
  CourseStatusByTeacher,
  UpdateCourseByTeacherDto,
} from "../elearning-backend/src/modules/courses/dto/update-course-by-teacher.dto";
import { CreateChapterDto } from "../elearning-backend/src/modules/courses/dto/create-chapter.dto";
import { CreateEpisodeDto } from "../elearning-backend/src/modules/courses/dto/create-episode.dto";
import { CreateQuizQuestionDto } from "../elearning-backend/src/modules/courses/dto/create-quiz-question.dto";
import { CreateQuizAnswerDto } from "../elearning-backend/src/modules/courses/dto/create-quiz-answer.dto";
import { CreateMaterialDto } from "../elearning-backend/src/modules/courses/dto/create-material.dto";
import { UpdateCourseMaterialDto } from "../elearning-backend/src/modules/courses/dto/update-course-material.dto";
import { UpdateChapterDto } from "../elearning-backend/src/modules/courses/dto/update-chapter.dto";
import { UpdateEpisodeDto } from "../elearning-backend/src/modules/courses/dto/update-episode.dto";
import { UpdateQuestionDto } from "../elearning-backend/src/modules/courses/dto/update-question.dto";
import { UpdateQuizAnswerDto } from "../elearning-backend/src/modules/courses/dto/update-answer.dto";
import { SearchCoursesDto } from "../elearning-backend/src/modules/courses/dto/search-courses.dto";

config();

let dataSource: DataSource;
let queryRunner: QueryRunner;
let service: CoursesService;

let courseRepo: Repository<Course>;
let chapterRepo: Repository<Chapter>;
let episodeRepo: Repository<Episode>;
let questionRepo: Repository<QuizQuestion>;
let answerRepo: Repository<QuizAnswer>;
let materialRepo: Repository<CourseMaterial>;
let userRepo: Repository<User>;
let subjectRepo: Repository<Subject>;
let gradeRepo: Repository<GradeLevel>;
let enrollmentRepo: Repository<Enrollment>;

const uid = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

async function seedUser(role: UserRole) {
  const user = userRepo.create({
    email: `${role.toLowerCase()}_${uid()}@test.local`,
    passwordHash: "hash",
    fullName: `${role} User`,
    phone: "0900000000",
    role,
    status: UserStatus.ACTIVE,
  });
  return userRepo.save(user);
}

async function seedSubject() {
  return subjectRepo.save(subjectRepo.create({ name: `Subject_${uid()}` }));
}

async function seedGrade() {
  return gradeRepo.save(gradeRepo.create({ name: `Grade_${uid()}` }));
}

async function seedCourse(
  status: CourseStatus = CourseStatus.DRAFT,
  teacher?: User,
) {
  const realTeacher = teacher ?? (await seedUser(UserRole.TEACHER));
  const subject = await seedSubject();
  const grade = await seedGrade();
  const dto: CreateCourseDto = {
    teacherId: realTeacher.id,
    title: `Course_${uid()}`,
    summary: "Summary",
    thumbnailUrl: "thumb.png",
    subjectId: subject.id,
    gradeLevelId: grade.id,
    status,
  };
  return service.createCourse(dto);
}

async function seedChapter(courseId: number) {
  return service.createChapter(
    { title: `Ch_${uid()}`, order: 1 } as CreateChapterDto,
    courseId,
  );
}

async function seedEpisode(
  courseId: number,
  chapterId: number,
  type: EpisodeType = EpisodeType.VIDEO,
) {
  return service.createEpisode(
    {
      title: `Ep_${uid()}`,
      order: 1,
      type,
      videoUrl:
        type === EpisodeType.VIDEO ? "https://cdn/video.mp4" : undefined,
      durationSeconds: type === EpisodeType.VIDEO ? 120 : undefined,
    } as CreateEpisodeDto,
    courseId,
    chapterId,
  );
}

beforeAll(async () => {
  dataSource = new DataSource({
    type: "mysql",
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    username: process.env.DATABASE_USERNAME || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "elearning",
    entities: Object.values(entities),
    synchronize: false,
    logging: false,
  });
  await dataSource.initialize();
});

beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  courseRepo = queryRunner.manager.getRepository(Course);
  chapterRepo = queryRunner.manager.getRepository(Chapter);
  episodeRepo = queryRunner.manager.getRepository(Episode);
  questionRepo = queryRunner.manager.getRepository(QuizQuestion);
  answerRepo = queryRunner.manager.getRepository(QuizAnswer);
  materialRepo = queryRunner.manager.getRepository(CourseMaterial);
  userRepo = queryRunner.manager.getRepository(User);
  subjectRepo = queryRunner.manager.getRepository(Subject);
  gradeRepo = queryRunner.manager.getRepository(GradeLevel);
  enrollmentRepo = queryRunner.manager.getRepository(Enrollment);

  service = new CoursesService(
    courseRepo,
    chapterRepo,
    episodeRepo,
    questionRepo,
    answerRepo,
    materialRepo,
    userRepo,
    new CourseMapper(),
  );
});

afterEach(async () => {
  if (queryRunner) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});

describe("CoursesService real DB integration", () => {
  // TC_COURSE_001
  it("createCourse + findCourseById + getCourses + getApprovedCourses + searchCourses", async () => {
    const teacher = await seedUser(UserRole.TEACHER);
    const student = await seedUser(UserRole.STUDENT);
    const subject = await seedSubject();
    const grade = await seedGrade();

    const created = await service.createCourse({
      teacherId: teacher.id,
      title: "Real DB Course",
      summary: "Real summary",
      thumbnailUrl: "thumb.png",
      subjectId: subject.id,
      gradeLevelId: grade.id,
      status: CourseStatus.PUBLISHED,
    } as CreateCourseDto);

    // CheckDB
    const dbCourse = await courseRepo.findOne({ where: { id: created.id } });
    expect(dbCourse?.title).toBe("Real DB Course");

    await enrollmentRepo.save(
      enrollmentRepo.create({
        student,
        course: created,
      }),
    );

    const found = await service.findCourseById(created.id, student.id);
    expect(found.id).toBe(created.id);
    expect((found as any).enrollment).toBeDefined();

    const byTeacher = await service.getCourses({
      role: "TEACHER",
      sub: teacher.id,
    });
    expect(byTeacher.courses.length).toBeGreaterThanOrEqual(1);

    const approved = await service.getApprovedCourses();
    expect(approved.total).toBeGreaterThanOrEqual(1);

    const searched = await service.searchCourses({
      keyword: "Real DB",
      page: 1,
      limit: 10,
    } as SearchCoursesDto);
    expect(searched.total).toBeGreaterThanOrEqual(1);
  });

  // TC_COURSE_002
  it("updateCourseByAdmin with reject validation and approve path", async () => {
    const course = await seedCourse(CourseStatus.PENDING_REVIEW);

    await expect(
      service.updateCourseByAdmin(course.id, {
        status: CourseStatusByAdmin.REJECTED,
      } as UpdateCourseByAdminDto),
    ).rejects.toBeInstanceOf(BadRequestException);

    const updated = await service.updateCourseByAdmin(course.id, {
      status: CourseStatusByAdmin.APPROVED,
      rejectionReason: "",
    } as UpdateCourseByAdminDto);

    // CheckDB
    const dbCourse = await courseRepo.findOne({ where: { id: updated.id } });
    expect(dbCourse?.status).toBe(CourseStatus.APPROVED as any);
    expect(dbCourse?.rejectionReason).toBe("");
  });

  // TC_COURSE_003
  it("updateCourseByTeacher and deleteCourse with ownership checks", async () => {
    const owner = await seedUser(UserRole.TEACHER);
    const other = await seedUser(UserRole.TEACHER);
    const course = await seedCourse(CourseStatus.DRAFT, owner);

    await expect(
      service.updateCourseByTeacher(
        course.id,
        { title: "X" } as UpdateCourseByTeacherDto,
        { sub: other.id },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const ok = await service.updateCourseByTeacher(
      course.id,
      {
        title: "Owned update",
        status: CourseStatusByTeacher.DRAFT,
      } as UpdateCourseByTeacherDto,
      { sub: owner.id },
    );
    expect(ok.title).toBe("Owned update");

    await expect(
      service.deleteCourse(course.id, { role: "TEACHER", sub: other.id }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.deleteCourse(course.id, { role: "TEACHER", sub: owner.id });

    // CheckDB
    const gone = await courseRepo.findOne({ where: { id: course.id } });
    expect(gone).toBeNull();
  });

  // TC_COURSE_004
  it("chapter CRUD + findAllChapters", async () => {
    const course = await seedCourse(CourseStatus.DRAFT);
    const chapter = await service.createChapter(
      { title: "Chapter A", order: 1 } as CreateChapterDto,
      course.id,
    );

    const found = await service.findChapterById(chapter.id, course.id);
    expect(found.id).toBe(chapter.id);

    const updated = await service.updateChapterById(chapter.id, course.id, {
      title: "Chapter B",
    } as UpdateChapterDto);
    expect(updated.title).toBe("Chapter B");

    const all = await service.findAllChapters(course.id);
    expect(all.length).toBe(1);

    await service.deleteChapterById(chapter.id, course.id);

    // CheckDB
    const deleted = await chapterRepo.findOne({ where: { id: chapter.id } });
    expect(deleted).toBeNull();
  });

  // TC_COURSE_005
  it("episode CRUD + video validation + findAllEpisodes", async () => {
    const course = await seedCourse(CourseStatus.DRAFT);
    const chapter = await seedChapter(course.id);

    await expect(
      service.createEpisode(
        {
          title: "Bad video",
          order: 1,
          type: EpisodeType.VIDEO,
        } as CreateEpisodeDto,
        course.id,
        chapter.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const quizEp = await service.createEpisode(
      {
        title: "Quiz Ep",
        order: 2,
        type: EpisodeType.QUIZ,
      } as CreateEpisodeDto,
      course.id,
      chapter.id,
    );
    expect(quizEp.videoUrl).toBe("");

    const videoEp = await seedEpisode(course.id, chapter.id, EpisodeType.VIDEO);
    const found = await service.findEpisodeById(
      course.id,
      chapter.id,
      videoEp.id,
    );
    expect(found.id).toBe(videoEp.id);

    const updated = await service.updateEpisodeById(
      course.id,
      chapter.id,
      videoEp.id,
      {
        title: "Video Updated",
      } as UpdateEpisodeDto,
    );
    expect(updated.title).toBe("Video Updated");

    const all = await service.findAllEpisodes(course.id, chapter.id);
    expect(all.length).toBeGreaterThanOrEqual(1);

    await service.deleteEpisodeById(course.id, chapter.id, videoEp.id);

    const deleted = await episodeRepo.findOne({ where: { id: videoEp.id } });
    expect(deleted).toBeNull();
  });

  // TC_COURSE_006
  it("quiz question CRUD + findAllQuestions", async () => {
    const course = await seedCourse(CourseStatus.DRAFT);
    const chapter = await seedChapter(course.id);
    const quizEpisode = await seedEpisode(
      course.id,
      chapter.id,
      EpisodeType.QUIZ,
    );

    const question = await service.createQuizQuestion(
      { content: "Question 1", order: 1 } as CreateQuizQuestionDto,
      course.id,
      chapter.id,
      quizEpisode.id,
    );

    const updated = await service.updateQuestionById(
      { content: "Question updated" } as UpdateQuestionDto,
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
    );
    expect(updated.content).toBe("Question updated");

    const all = await service.findAllQuestions(
      course.id,
      chapter.id,
      quizEpisode.id,
    );
    expect(all.length).toBe(1);

    await service.deleteQuestionById(
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
    );

    const deleted = await questionRepo.findOne({ where: { id: question.id } });
    expect(deleted).toBeNull();
  });

  // TC_COURSE_007
  it("quiz answer CRUD + findAllAnswers", async () => {
    const course = await seedCourse(CourseStatus.DRAFT);
    const chapter = await seedChapter(course.id);
    const quizEpisode = await seedEpisode(
      course.id,
      chapter.id,
      EpisodeType.QUIZ,
    );
    const question = await service.createQuizQuestion(
      { content: "Question 1", order: 1 } as CreateQuizQuestionDto,
      course.id,
      chapter.id,
      quizEpisode.id,
    );

    const answer = await service.createQuizAnswer(
      { content: "Answer 1", order: 1, isCorrect: true } as CreateQuizAnswerDto,
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
    );

    const updated = await service.updateAnswerById(
      {
        content: "Answer updated",
        order: 2,
        isCorrect: true,
      } as UpdateQuizAnswerDto,
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
      answer.id,
    );
    expect(updated.content).toBe("Answer updated");

    const all = await service.findAllAnswers(
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
    );
    expect(all.length).toBe(1);

    await service.deleteAnswerById(
      course.id,
      chapter.id,
      quizEpisode.id,
      question.id,
      answer.id,
    );

    const deleted = await answerRepo.findOne({ where: { id: answer.id } });
    expect(deleted).toBeNull();
  });

  // TC_COURSE_008
  it("course material CRUD + findAllCourseMaterials", async () => {
    const course = await seedCourse(CourseStatus.DRAFT);

    const material = await service.createCourseMaterial(
      {
        title: "Material 1",
        fileUrl: "https://cdn/file.pdf",
        fileSizeKb: 100,
      } as CreateMaterialDto,
      course.id,
    );

    const updated = await service.updateCourseMaterialById(
      {
        title: "Material updated",
        fileUrl: "https://cdn/file2.pdf",
        fileSizeKb: 101,
      } as UpdateCourseMaterialDto,
      material.id,
    );
    expect(updated.title).toBe("Material updated");

    const listed = await service.findAllCourseMaterials(course.id);
    expect(listed.length).toBe(1);

    await service.deleteCourseMaterialById(material.id);

    const deleted = await materialRepo.findOne({ where: { id: material.id } });
    expect(deleted).toBeNull();
  });

  // TC_COURSE_009
  it("getFeaturedCourses + getCoursesBySubject + getPlatformStats", async () => {
    const teacher = await seedUser(UserRole.TEACHER);
    const subject = await seedSubject();
    const grade = await seedGrade();

    const course = await service.createCourse({
      teacherId: teacher.id,
      title: `Featured_${uid()}`,
      summary: "Summary",
      thumbnailUrl: "thumb.png",
      subjectId: subject.id,
      gradeLevelId: grade.id,
      status: CourseStatus.PUBLISHED,
    } as CreateCourseDto);

    const chapter = await seedChapter(course.id);
    await seedEpisode(course.id, chapter.id, EpisodeType.VIDEO);

    const featured = await service.getFeaturedCourses(8);
    expect(Array.isArray(featured.courses)).toBe(true);

    const bySubject = await service.getCoursesBySubject(subject.id, 8);
    expect(Array.isArray(bySubject.courses)).toBe(true);

    const stats = await service.getPlatformStats();
    expect(stats.totalCourses).toBeGreaterThanOrEqual(1);
    expect(stats.totalTeachers).toBeGreaterThanOrEqual(1);
  });

  // TC_COURSE_010
  it("throws NotFound for missing entities", async () => {
    await expect(service.findCourseById(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findChapterById(999999, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findEpisodeById(1, 1, 999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.findQuizQuestionById(1, 1, 1, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findAnswerById(1, 1, 1, 1, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findCourseMaterialById(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
