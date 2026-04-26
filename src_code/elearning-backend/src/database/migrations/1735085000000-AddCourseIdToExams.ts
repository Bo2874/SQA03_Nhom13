import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddCourseIdToExams1735085000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if course_id column already exists
        const table = await queryRunner.getTable("exams");
        const courseIdColumn = table?.findColumnByName("course_id");

        if (!courseIdColumn) {
            // Add course_id column to exams table
            await queryRunner.addColumn(
                "exams",
                new TableColumn({
                    name: "course_id",
                    type: "bigint",
                    isNullable: true,
                })
            );

            // Add foreign key constraint
            await queryRunner.createForeignKey(
                "exams",
                new TableForeignKey({
                    columnNames: ["course_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "courses",
                    onDelete: "SET NULL",
                    onUpdate: "CASCADE",
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Find and drop the foreign key
        const table = await queryRunner.getTable("exams");
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("course_id") !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey("exams", foreignKey);
        }

        // Drop the column
        await queryRunner.dropColumn("exams", "course_id");
    }
}
