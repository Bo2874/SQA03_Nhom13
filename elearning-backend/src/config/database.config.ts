import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as entities from "../entities";

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
    type: "mysql",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306", 10) || 3306,
    username: process.env.DATABASE_USERNAME || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "elearning",
    entities: Object.values(entities),
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
});
