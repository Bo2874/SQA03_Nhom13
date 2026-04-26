import { MigrationInterface, QueryRunner } from "typeorm";
import * as fs from "fs";
import * as path from "path";

export class InitSchema1763312736520 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = fs.readFileSync(
            path.join(__dirname, "init-schema.sql"),
            "utf8"
        );
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
