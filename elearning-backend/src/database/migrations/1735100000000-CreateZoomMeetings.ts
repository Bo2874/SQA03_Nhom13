import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from "typeorm";

export class CreateZoomMeetings1735100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "zoom_meetings",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: false,
                    },
                    {
                        name: "course_id",
                        type: "int",
                        isNullable: false,
                        unsigned: false,
                    },
                    {
                        name: "teacher_id",
                        type: "int",
                        isNullable: false,
                        unsigned: false,
                    },
                    {
                        name: "title",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "zoom_meeting_id",
                        type: "varchar",
                        length: "100",
                        isNullable: true,
                    },
                    {
                        name: "join_url",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "start_url",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "meeting_password",
                        type: "varchar",
                        length: "50",
                        isNullable: true,
                    },
                    {
                        name: "scheduled_time",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "duration_minutes",
                        type: "int",
                        default: 60,
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        default: "'scheduled'",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Add foreign key to courses
        await queryRunner.createForeignKey(
            "zoom_meetings",
            new TableForeignKey({
                columnNames: ["course_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "courses",
                onDelete: "CASCADE",
            })
        );

        // Add foreign key to users (teacher)
        await queryRunner.createForeignKey(
            "zoom_meetings",
            new TableForeignKey({
                columnNames: ["teacher_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("zoom_meetings");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("zoom_meetings", foreignKey);
            }
        }
        await queryRunner.dropTable("zoom_meetings");
    }
}
