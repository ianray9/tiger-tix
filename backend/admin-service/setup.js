const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../shared-db/database.sqlite");
const initPath = path.resolve(__dirname, "../shared-db/init.sql");

console.log("Setting up server...")

// Get the text to create the sql tables
const sqlText = fs.readFileSync(initPath, "utf8");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Could not open database:", error.message);
        process.exit(1);
    }
    console.log("Connect to database")

    // Create data base tables
    db.exec(sqlText, (error) => {
        if (error) {
            console.error("Could not create database tables:", error.message);
        }
        console.log("Successfully created init database tables");

        db.close();
    });
});


