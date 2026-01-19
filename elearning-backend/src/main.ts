import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { connectRedis } from "./common/utils/redis.client";
import { DataSource } from "typeorm";
import { User, UserRole, UserStatus } from "./entities/user.entity";
import * as bcrypt from "bcrypt";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS - Allow multiple frontends (user frontend + admin frontend)
    const allowedOrigins = [
        "http://localhost:3000", // User frontend
        "http://localhost:3001", // User frontend (alternative port)
        "http://localhost:3002", // Admin frontend
        process.env.FRONTEND_URL, // From .env
    ].filter(Boolean);

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip properties that don't have decorators
            transform: true,
            forbidNonWhitelisted: false, // Don't throw error for extra properties, just strip them
            transformOptions: {
                exposeDefaultValues: true,
                enableImplicitConversion: true,
            },
        })
    );

    // Cookie parser
    app.use(cookieParser());

    // Connect to Redis
    await connectRedis();

    // Ensure admin account exists on first startup
    await initAdminAccount(app);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

async function initAdminAccount(app: any) {
    try {
        const dataSource: DataSource = app.get(DataSource);
        const userRepository = dataSource.getRepository(User);

        const adminEmail = process.env.ADMIN_EMAIL || "admin@elearning.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        const adminExists = await userRepository.findOne({ where: { email: adminEmail } });

        if (adminExists) {
            console.log("Admin account already exists.");
            console.log("Admin Login Credentials:");
            console.log("Email:   ", adminEmail);
            console.log("Password:", adminPassword);
            return;
        }

        const admin = userRepository.create({
            email: adminEmail,
            passwordHash: await bcrypt.hash(adminPassword, 10),
            fullName: "System Administrator",
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
        });

        await userRepository.save(admin);

        console.log("Admin account created successfully!");
        console.log("Admin Login Credentials:");
        console.log("Email:   ", adminEmail);
        console.log("Password:", adminPassword);
    } catch (error) {
        console.error("Error ensuring admin account:", error);
    }
}
