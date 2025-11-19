const sqlite3 = require("sqlite3").verbose()
const request = require("supertest");
const { createApp, _test, JWT_SECRET } = require('../app');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

let db;
let app;

describe("Auth Service - Integration tests", () => {

    // Before each test, clear the users table
    beforeEach((done) => {
        db = new sqlite3.Database(":memory:", (err) => {
            if (err) return done(err);
            app = createApp(db);
            done();
        });
    });

    afterAll((done) => {
        db.close(done);
    });

    test("POST /api/auth/register should register a new user", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "test@example.com",
                password: "password123"
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user.email).toBe("test@example.com");
    });

    test("POST /api/auth/register should prevent duplicate emails", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ email: "test@example.com", password: "password123" });

        const res = await request(app)
            .post("/api/auth/register")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(409);
    });

    test("POST /api/auth/login should log in a user and return a token", async () => {
        // Register
        await request(app)
            .post("/api/auth/register")
            .send({ email: "login@test.com", password: "password123" });

        // Login
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "login@test.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user.email).toBe("login@test.com");

        // save token for next test
    });
});

describe("Auth Service – Unit Tests", () => {

    const { generateToken, authMiddleware } = _test;

    test("generateToken creates a valid JWT containing userId & email", () => {
        const fakeUser = { id: 5, email: "unit@test.com" };
        const token = generateToken(fakeUser);

        const decoded = jwt.verify(token, JWT_SECRET);

        expect(decoded.userId).toBe(5);
        expect(decoded.email).toBe("unit@test.com");
    });

    test("authMiddleware returns 401 when no token is provided", () => {
        const req = { headers: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("authMiddleware passes request when token is valid", () => {
        const token = jwt.sign({ userId: 123, email: "unit@test.com" }, JWT_SECRET);

        const req = {
            headers: { authorization: `Bearer ${token}` }
        };
        const res = {};
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(req.user.userId).toBe(123);
        expect(req.user.email).toBe("unit@test.com");
        expect(next).toHaveBeenCalled();
    });
});
