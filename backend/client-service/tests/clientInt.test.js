const request = require("supertest");
const express = require("express");

const { createTestDB } = require("./setupTest");
const { initDB } = require("../models/clientModel");
const clientController = require("../controllers/clientController");

let app;
let testDB;
let eventId1;
let eventId2;
let eventId3;

const insertEvent = async (event) => {
    const {
        title,
        description,
        startTime,
        endTime,
        venue,
        capacity
    } = event;

    return new Promise((resolve, reject) => {
        testDB.run(
            `INSERT INTO events (title, description, startTime, endTime, venue, capacity, availableTickets)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, startTime, endTime, venue, capacity, capacity],
            function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
};

// Set up in memory database and add events to test with
beforeAll(async () => {
    testDB = createTestDB();
    initDB(testDB);

    app = express();
    app.use(express.json());

    app.get("/client/events", (req, res) => clientController.getEvents(req, res));
    app.post("/client/events/:id/purchase", (req, res) => clientController.purchaseTicket(req, res));

    eventId1 = await insertEvent({
        title: "Original Event 1",
        description: "Original Description",
        startTime: "2025-11-10T18:00:00",
        endTime: "2025-11-10T20:00:00",
        venue: "Original Venue",
        capacity: 5,
    });

    eventId2 = await insertEvent({
        title: "Original Event 2",
        description: "Original Description",
        startTime: "2025-11-10T18:00:00",
        endTime: "2025-11-10T20:00:00",
        venue: "Original Venue",
        capacity: 0,
    });

    eventId3 = await insertEvent({
        title: "Concurrent Event",
        description: "Concurrency Test Event",
        startTime: "2025-11-15T19:00:00",
        endTime: "2025-11-15T21:00:00",
        venue: "Original Venue",
        capacity: 2,
    });
});

afterAll((done) => {
    testDB.close(done);
});

describe("Client Controller - Integration", () => {
    test("GET /client/events returns all events", async () => {
        const res = await request(app).get("/client/events");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);
        expect(res.body[0]).toHaveProperty("title", "Original Event 1");
        expect(res.body[1]).toHaveProperty("title", "Original Event 2");
        expect(res.body[2]).toHaveProperty("title", "Concurrent Event");
    });

    test("POST /client/events/:id/purchase successfully purchases a ticket", async () => {
        const res = await request(app)
            .post(`/client/events/${eventId1}/purchase`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Ticket purchased successfully" });
    });

    test("POST /client/events/:id/purchase fails when no tickets available", async () => {
        const res = await request(app)
            .post(`/client/events/${eventId2}/purchase`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("No tickets available");
    });

    test("POST /client/events/:id/purchase respects capacity (concurrency simulation)", async () => {
        const results = [];

        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post(`/client/events/${eventId3}/purchase`);
            results.push(res);
        }

        const success = results.filter(r => r.status === 200).length;
        const failures = results.filter(r => r.status === 400).length;

        expect(success).toBe(2);
        expect(failures).toBeGreaterThanOrEqual(3);
    });
});
