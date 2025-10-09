CREATE TABLE IF NOT EXISTS events (
    event_id INTERGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    available_tickets INTEGER NOT NULL CHECK (Capacity >= 0 
    AND available_tickets <= capacity)
);
