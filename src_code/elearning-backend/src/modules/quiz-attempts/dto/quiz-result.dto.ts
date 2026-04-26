export class QuizResultDto {
    attemptId: number;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    submittedAt: Date;
    passed: boolean;
    details: Array<{
        questionId: number;
        questionContent: string;
        questionImageUrl?: string;
        studentAnswerId: number;
        studentAnswerContent: string;
        correctAnswerId: number;
        correctAnswerContent: string;
        isCorrect: boolean;
    }>;
}
