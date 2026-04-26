require("dotenv").config();

console.log("=== TEST FILE .ENV ===");
console.log("DATABASE_HOST:", process.env.DATABASE_HOST);
console.log("DATABASE_PORT:", process.env.DATABASE_PORT);
console.log("DATABASE_USERNAME:", process.env.DATABASE_USERNAME);
console.log(
    "DATABASE_PASSWORD:",
    process.env.DATABASE_PASSWORD
        ? "***" + process.env.DATABASE_PASSWORD.slice(-3)
        : "KHÔNG CÓ"
);
console.log("DATABASE_NAME:", process.env.DATABASE_NAME);
console.log("=====================");
