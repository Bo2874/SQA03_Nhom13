import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Exam } from "./exam.entity";
import { ExamAnswer } from "./exam-answer.entity";

@Entity("exam_questions")
export class ExamQuestion {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;

    @Column({ name: "exam_id", type: "bigint", nullable: false })
    examId: number;

    @Column({ name: "content", type: "text", nullable: false })
    content: string;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl: string | null;

    @Column({ name: "order", type: "int", nullable: false })
    order: number;

    @ManyToOne(() => Exam, (exam) => exam.questions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "exam_id" })
    exam: Exam;

    @OneToMany(() => ExamAnswer, (answer) => answer.question, { cascade: true })
    answers: ExamAnswer[];
}
