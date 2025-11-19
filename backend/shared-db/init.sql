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
INSERT INTO events (title, description, startTime, endTime, venue, capacity, availableTickets)
VALUES (
    "Jazz Night",
    "A fun evening of jazz music.",
    "2025-11-10 19:00",
    "2025-11-10 21:00",
    "Brooks Center",
    50,
    50
);
