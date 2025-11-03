const sqlite3 = require("sqlite3").verbose();

// Create a in memory data base for tests
const createTestDB = () => {
    const db = new sqlite3.Database(":memory:");

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS events (
                eventID INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                startTime TEXT,
                endTime TEXT,
                venue TEXT,
                capacity INTEGER,
                availableTickets INTEGER
            );
        `);
    });

    return db;
};

module.exports = { createTestDB };
