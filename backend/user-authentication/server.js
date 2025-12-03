const sqlite3 = require("sqlite3").verbose()
const path = require("path");
const fs = require("fs");
const { createApp } = require("./app")

// Use environment variable for database path (Railway volume) or fallback to local path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../shared-db/database.sqlite");

// Ensure the directory exists (important for Railway volumes)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
    console.log(`Connected to SQLite database at: ${dbPath}`);
});

const app = createApp(db);

const PORT = process.env.PORT || process.env.AUTH_PORT || 7002;
app.listen(PORT, () => {
    console.log(`🔐 Auth service running on port ${PORT}`);
});
