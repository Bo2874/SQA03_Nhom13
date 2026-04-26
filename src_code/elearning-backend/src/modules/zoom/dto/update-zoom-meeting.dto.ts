import { PartialType } from "@nestjs/mapped-types";
import { CreateZoomMeetingDto } from "./create-zoom-meeting.dto";
import { IsOptional, IsString } from "class-validator";

export class UpdateZoomMeetingDto extends PartialType(CreateZoomMeetingDto) {
    @IsOptional()
    @IsString()
    status?: string;
}
