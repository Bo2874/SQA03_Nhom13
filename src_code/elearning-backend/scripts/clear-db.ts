import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";

async function clearDatabase() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log("Clearing database...");

    try {
        const entities = dataSource.entityMetadatas;

        for (const entity of entities) {
            const repository = dataSource.getRepository(entity.name);
            await repository.query(`SET FOREIGN_KEY_CHECKS = 0;`);
            await repository.clear();
            await repository.query(`SET FOREIGN_KEY_CHECKS = 1;`);
            console.log(`✅ Cleared ${entity.tableName}`);
        }

        console.log("Database cleared successfully!");
    } catch (error) {
        console.error("Error clearing database:", error);
    } finally {
        await app.close();
    }
}

clearDatabase();
