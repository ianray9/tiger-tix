const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../shared-db/database.sqlite');
const db = new Database(dbPath);

// Helper: fetch events with availability
function getAvailableEvents() {
  const stmt = db.prepare(`SELECT id, name, total_tickets, tickets_sold, (total_tickets - tickets_sold) AS remaining FROM events`);
  return stmt.all();
}

function getEventByName(name) {
  const stmt = db.prepare(`SELECT * FROM events WHERE LOWER(name) = LOWER(?)`);
  return stmt.get(name);
}

function getEventById(id) {
  const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
  return stmt.get(id);
}


function bookTickets(eventId, quantity) {
  const txn = db.transaction((eventId, quantity) => {
    const event = db.prepare(`SELECT total_tickets, tickets_sold FROM events WHERE id = ?`).get(eventId);
    if (!event) throw new Error('EventNotFound');
    const remaining = event.total_tickets - event.tickets_sold;
    if (remaining < quantity) throw new Error('NotEnoughTickets');

    db.prepare(`UPDATE events SET tickets_sold = tickets_sold + ? WHERE id = ?`).run(quantity, eventId);
    const info = db.prepare(`INSERT INTO bookings (event_id, quantity) VALUES (?, ?)`).run(eventId, quantity);
    return info.lastInsertRowid;
  });

  return txn(eventId, quantity);
}

module.exports = {
  db,
  getAvailableEvents,
  getEventByName,
  getEventById,
  bookTickets
};
