import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ZoomService } from "./zoom.service";
import { ZoomController } from "./zoom.controller";
import { ZoomMeeting } from "../../entities/zoom-meeting.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ZoomMeeting])],
    controllers: [ZoomController],
    providers: [ZoomService],
    exports: [ZoomService],
})
export class ZoomModule {}
