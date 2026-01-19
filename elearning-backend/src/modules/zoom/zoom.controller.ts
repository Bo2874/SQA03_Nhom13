import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from "@nestjs/common";
import { ZoomService } from "./zoom.service";
import { CreateZoomMeetingDto } from "./dto/create-zoom-meeting.dto";
import { UpdateZoomMeetingDto } from "./dto/update-zoom-meeting.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { ApiResponse } from "../../common/dto/api-response.dto";

@Controller("api/v1/zoom")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomController {
    constructor(private readonly zoomService: ZoomService) {}

    @Post("meetings")
    @Roles(UserRole.TEACHER)
    async createMeeting(@Body() createDto: CreateZoomMeetingDto) {
        const meeting = await this.zoomService.createMeeting(createDto);
        return ApiResponse.success(meeting, "Zoom meeting created successfully");
    }

    @Get("meetings")
    @Roles(UserRole.TEACHER, UserRole.STUDENT)
    async getMeetings(@Query("courseId") courseId?: string) {
        const meetings = await this.zoomService.findAll(
            courseId ? +courseId : undefined
        );
        return ApiResponse.success(meetings, "success");
    }

    @Get("meetings/:id")
    @Roles(UserRole.TEACHER, UserRole.STUDENT)
    async getMeeting(@Param("id") id: string) {
        const meeting = await this.zoomService.findOne(+id);
        return ApiResponse.success(meeting, "success");
    }

    @Put("meetings/:id")
    @Roles(UserRole.TEACHER)
    async updateMeeting(
        @Param("id") id: string,
        @Body() updateDto: UpdateZoomMeetingDto
    ) {
        const meeting = await this.zoomService.update(+id, updateDto);
        return ApiResponse.success(meeting, "Zoom meeting updated successfully");
    }

    @Delete("meetings/:id")
    @Roles(UserRole.TEACHER)
    async deleteMeeting(@Param("id") id: string) {
        await this.zoomService.delete(+id);
        return ApiResponse.success(null, "Zoom meeting deleted successfully");
    }
}
