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
