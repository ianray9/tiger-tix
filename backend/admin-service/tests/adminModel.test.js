const { createTestDB } = require("./setupTest");
const { insertEvent, updateEvent, initDB } = require("../models/adminModel");

let testDB;
let validEventId;

beforeAll(() => {
    // in-memory test DB
    testDB = createTestDB();
    initDB(testDB);
});

afterAll((done) => {
    testDB.close(done);
});

describe("Admin Model", () => {
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
