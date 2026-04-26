import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";
import { User, UserRole, UserStatus } from "../src/entities/user.entity";
import * as bcrypt from "bcrypt";

async function createAdmin() {
    console.log("Creating admin account...\n");

    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        const userRepository = dataSource.getRepository(User);

        // Check if admin already exists
        const adminExists = await userRepository.findOne({
            where: { email: "admin@elearning.com" },
        });

        if (adminExists) {
            console.log("❌ Admin account already exists!");
            console.log("\nAdmin Login Credentials:");
            console.log("========================");
            console.log("Email:    admin@elearning.com");
            console.log("Password: admin123");
            console.log("========================\n");
        } else {
            // Create admin account
            const admin = userRepository.create({
                email: "admin@elearning.com",
                passwordHash: await bcrypt.hash("admin123", 10),
                fullName: "System Administrator",
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
            });

            await userRepository.save(admin);

            console.log("✅ Admin account created successfully!\n");
            console.log("Admin Login Credentials:");
            console.log("========================");
            console.log("Email:    admin@elearning.com");
            console.log("Password: admin123");
            console.log("========================\n");
            console.log("You can now login to the admin panel!");
        }
    } catch (error) {
        console.error("❌ Error creating admin account:", error);
        throw error;
    } finally {
        await app.close();
    }
}

createAdmin();
