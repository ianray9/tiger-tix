const sqlite3 = require("sqlite3").verbose()
const path = require("path");
const createApp = require("./app")

const dbPath = path.join(__dirname, "../shared-db/database.sqlite");
const db = new sqlite3.Database(dbPath);

const app = createApp(db);

const PORT = process.env.AUTH_PORT || 7002;
app.listen(PORT, () => {
    console.log(`🔐 Auth service running on http://localhost:${PORT}`);
});
