const { createTestDB } = require("./setupTest");
const { getAllEvents, purchaseTicket, initDB } = require("../models/clientModel");

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

describe("Client Model", () => {
    // Test getAllEvents to make sure all events are listed
    test("getAllEvents gets the previously inserted events", async () => {
        const events = await getAllEvents();
        expect(events.length).toBe(3);
        expect(events[0]).toMatchObject({
            title: "Original Event 1",
            venue: "Original Venue",
        });
        expect(events[1]).toMatchObject({
            title: "Original Event 2",
            venue: "Original Venue",
        });
        expect(events[2]).toMatchObject({
            title: "Concurrent Event",
            venue: "Original Venue",
        });
    });

    // Test to make sure you can purchase ticket from valid event and the amount goes down
    test("purchaseTicket successfully decrements available tickets", async () => {
        const res = await purchaseTicket(eventId1);
        expect(res).toEqual({ message: "Ticket purchased successfully" });

        const row = await new Promise((resolve, reject) => {
            testDB.get(
                "SELECT availableTickets FROM events WHERE eventID = ?",
                [eventId1],
                (err, row) => (err ? reject(err) : resolve(row))
            );
        });
        expect(row.availableTickets).toBe(4);
    });

    // Test to make sure you can not purchase a ticket if there are none left
    test("purchaseTicket fails if event has no available tickets", async () => {
        await expect(purchaseTicket(eventId2)).rejects.toThrow("No tickets available");
    });

    // Test model under concerent request simulation
    test("only allows up to available tickets to be purchased (concurrency simulation)", async () => {
        const results = [];

        // Run 5 purchase attempts sequentially instead of concurrently
        for (let i = 0; i < 5; i++) {
            try {
                const res = await purchaseTicket(eventId3);
                results.push(res);
            } catch (err) {
                results.push(err);
            }
        }

        const successCount = results.filter(
            (r) => r && r.message === "Ticket purchased successfully"
        ).length;

        const failureCount = results.filter(
            (r) => r instanceof Error && r.message.includes("No tickets available")
        ).length;

        expect(successCount).toBe(2);
        expect(failureCount).toBeGreaterThanOrEqual(3);

        const finalRow = await new Promise((resolve, reject) => {
            testDB.get(
                "SELECT availableTickets FROM events WHERE eventID = ?",
                [eventId3],
                (err, row) => (err ? reject(err) : resolve(row))
            );
        });

        expect(finalRow.availableTickets).toBe(0);
    });
});

