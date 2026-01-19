export class QuizAttemptResponseDto {
    id: number;
    episodeId: number;
    episodeTitle: string;
    studentId: number;
    studentName: string;
    score: number;
    submittedAt: Date;
    passed: boolean;
}
