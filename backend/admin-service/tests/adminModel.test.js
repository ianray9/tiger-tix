const request = require("supertest");
const express = require("express");
const { createTestDB } = require("./setupTest");
const { insertEvent, updateEvent, initDB } = require("../models/adminModel");
const { addEvent, editEvent } = require("../controllers/adminController");

let testDB;
let validEventId;

beforeAll(() => {
    // in-memory test DB
    testDB = createTestDB();
    initDB(testDB);

    // Build app
    app = express();
    app.use(express.json());
    app.post("/admin/events", (req, res) => addEvent(req, res, testDB));
    app.put("/admin/events/:id", (req, res) => editEvent(req, res, testDB))
});

afterAll((done) => {
    testDB.close(done);
});

describe("Admin Model - Integration tests", () => {
    test("POST /admin/events creates a new event", async () => {
        const eventBody = {
            title: "Concert Night",
            description: "Live concert",
            startTime: "2025-11-10T18:00:00",
            endTime: "2025-11-10T21:00:00",
            venue: "Main Hall",
            capacity: 300
        };

        const res = await request(app)
            .post("/admin/events")
            .send(eventBody);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("event");
        expect(res.body.event.title).toBe("Concert Night");
    });

    test("PUT /admin/events/:id updates a created event successfully", async () => {
        // Step 1 → Create event
        const createRes = await request(app)
            .post("/admin/events")
            .send({
                title: "Comedy Show",
                description: "Funny event",
                startTime: "2025-11-10T18:00:00",
                endTime: "2025-11-10T20:00:00",
                venue: "Room A",
                capacity: 200
            });

        const eventId = createRes.body.event.eventId;

        // Step 2 → Update event
        const updateRes = await request(app)
            .put(`/admin/events/${eventId}`)
            .send({
                title: "Comedy Show Updated",
                description: "Updated desc",
                startTime: "2025-11-10T18:00:00",
                endTime: "2025-11-10T20:00:00",
                venue: "Room A",
                capacity: 250,
                availableTickets: 250
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.event.title).toBe("Comedy Show Updated");
        expect(updateRes.body.event.capacity).toBe(250);
    });

});

describe("Admin Model - Unit tests", () => {
    // Test inserting a valid event
    test("insertEvent: inserts a valid event", (done) => {
        const eventData = {
            title: "Baseball Game",
            description: "Exciting baseball game",
            startTime: "2025-11-10T18:00:00",
            endTime: "2025-11-10T21:00:00",
            venue: "Stadium",
            capacity: 500
        };

        insertEvent(eventData, (err, result) => {
            expect(err).toBeNull();
            expect(result).toHaveProperty("eventId");
            expect(result.title).toBe("Baseball Game");
            expect(result.venue).toBe("Stadium");

            validEventId = result.eventId;
            done();
        });
    });

    // Test inserting an invalid event
    test("insertEvent: returns error for invalid data", (done) => {
        const invalidEvent = {
            title: null,
            description: "Invalid event",
            startTime: "2025-11-10T18:00:00",
            endTime: "2025-11-10T21:00:00",
            venue: "Nowhere",
            capacity: -10
        };

        insertEvent(invalidEvent, (err, result) => {
            expect(err).not.toBeNull();
            expect(result).toBeUndefined();
            done();
        });
    });

    // Test updating an event with valid body and id
    test("updateEvent: updates existing event successfully", (done) => {
        const updatedData = {
            title: "Updated Game",
            description: "Updated description",
            startTime: "2025-11-11T18:00:00",
            endTime: "2025-11-11T21:00:00",
            venue: "Updated Stadium",
            capacity: 600,
            availableTickets: 600
        };

        updateEvent(validEventId, updatedData, (err, result) => {
            expect(err).toBeNull();
            expect(result.eventId).toBe(validEventId);
            expect(result.title).toBe("Updated Game");
            expect(result.capacity).toBe(600);
            done();
        });
    });

    // Test updating a non existant event
    test("updateEvent: returns error for non-existent event", (done) => {
        const updatedData = {
            title: "Updated Game",
            description: "Updated description",
            startTime: "2025-11-11T18:00:00",
            endTime: "2025-11-11T21:00:00",
            venue: "Updated Stadium",
            capacity: 600,
            availableTickets: 600
        };

        updateEvent(9999, updatedData, (err, result) => {
            expect(err).not.toBeNull();
            expect(err.message).toBe("Event not found");
            expect(result).toBeUndefined();
            done();
        });
    });
});
