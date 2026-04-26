import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsOptional,
    IsDateString,
} from "class-validator";

export class CreateZoomMeetingDto {
    @IsNumber()
    @IsNotEmpty()
    courseId: number;

    @IsNumber()
    @IsNotEmpty()
    teacherId: number;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    joinUrl: string;

    @IsString()
    @IsOptional()
    zoomMeetingId?: string;

    @IsString()
    @IsOptional()
    meetingPassword?: string;

    @IsDateString()
    @IsOptional()
    scheduledTime?: string;

    @IsNumber()
    @IsOptional()
    durationMinutes?: number;
}
