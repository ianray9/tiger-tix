-- Events table
CREATE TABLE IF NOT EXISTS events (
    eventId INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    availableTickets INTEGER NOT NULL CHECK (capacity >= 0 
    AND availableTickets <= capacity)
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Insert sample event
INSERT OR IGNORE INTO events (title, description, startTime, endTime, venue, capacity, availableTickets)
VALUES (
    "Jazz Night",
    "A fun evening of jazz music.",
    "2025-11-10 19:00",
    "2025-11-10 21:00",
    "Brooks Center",
    50,
    50
);
