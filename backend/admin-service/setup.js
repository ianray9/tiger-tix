const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Use environment variable for database path (Railway volume) or fallback to local path
const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, "../shared-db/database.sqlite");
const initPath = path.resolve(__dirname, "../shared-db/init.sql");

// Ensure the directory exists (important for Railway volumes)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log("Setting up server...")
console.log(`Database path: ${dbPath}`);

// Get the text to create the sql tables
const sqlText = fs.readFileSync(initPath, "utf8");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Could not open database:", error.message);
        process.exit(1);
    }
    console.log("Connected to database")

    // Create data base tables
    db.exec(sqlText, (error) => {
        if (error) {
            console.error("Could not create database tables:", error.message);
        }
        console.log("Successfully created init database tables");

        db.close();
    });
});


