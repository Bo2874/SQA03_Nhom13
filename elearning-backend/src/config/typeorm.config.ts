import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config();

export const dataSourceOptions: DataSourceOptions = {
    type: "mysql",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306", 10) || 3306,
    username: process.env.DATABASE_USERNAME || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "elearning",
    entities: [join(__dirname, "..", "entities", "**", "*.entity{.ts,.js}")],
    migrations: [join(__dirname, "..", "database", "migrations", "*{.ts,.js}")],
    synchronize: false,
    extra: {
        multipleStatements: true,
    },
    logging: process.env.NODE_ENV === "development",
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
