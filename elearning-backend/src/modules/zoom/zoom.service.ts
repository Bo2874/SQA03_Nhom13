import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ZoomMeeting } from "../../entities/zoom-meeting.entity";
import { CreateZoomMeetingDto } from "./dto/create-zoom-meeting.dto";
import { UpdateZoomMeetingDto } from "./dto/update-zoom-meeting.dto";

@Injectable()
export class ZoomService {
    constructor(
        @InjectRepository(ZoomMeeting)
        private zoomMeetingRepository: Repository<ZoomMeeting>
    ) {}

    async createMeeting(
        createDto: CreateZoomMeetingDto
    ): Promise<ZoomMeeting> {
        // Teacher provides their own Zoom meeting info
        const meeting = this.zoomMeetingRepository.create({
            ...createDto,
            status: "scheduled",
        });

        return await this.zoomMeetingRepository.save(meeting);
    }

    async findAll(courseId?: number): Promise<ZoomMeeting[]> {
        const query = this.zoomMeetingRepository
            .createQueryBuilder("meeting")
            .leftJoinAndSelect("meeting.course", "course")
            .leftJoinAndSelect("meeting.teacher", "teacher");

        if (courseId) {
            query.where("meeting.courseId = :courseId", { courseId });
        }

        return await query.orderBy("meeting.scheduledTime", "DESC").getMany();
    }

    async findOne(id: number): Promise<ZoomMeeting> {
        const meeting = await this.zoomMeetingRepository.findOne({
            where: { id },
            relations: ["course", "teacher"],
        });

        if (!meeting) {
            throw new NotFoundException("Zoom meeting not found");
        }

        return meeting;
    }

    async update(
        id: number,
        updateDto: UpdateZoomMeetingDto
    ): Promise<ZoomMeeting> {
        const meeting = await this.findOne(id);
        Object.assign(meeting, updateDto);
        return await this.zoomMeetingRepository.save(meeting);
    }

    async delete(id: number): Promise<void> {
        const meeting = await this.findOne(id);
        await this.zoomMeetingRepository.remove(meeting);
    }
}
