const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Ensure shared-db directory exists for SQLite file
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'shared-db/database.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
}

// Initialize database with all required tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const initPath = path.join(__dirname, 'shared-db/init.sql');

        if (!fs.existsSync(initPath)) {
            console.warn(`Warning: init.sql not found at ${initPath}`);
            return resolve(); // Continue anyway, services will create tables as needed
        }

        const sqlText = fs.readFileSync(initPath, 'utf8');
        const db = new sqlite3.Database(dbPath, (error) => {
            if (error) {
                console.error('Database connection error:', error.message);
                return reject(error);
            }

            console.log(`Initializing database at: ${dbPath}`);

            // Create tables
            db.exec(sqlText, (error) => {
                if (error) {
                    console.error('Error creating database tables:', error.message);
                    db.close();
                    return reject(error);
                }

                // Also create users table (used by auth service)
                db.exec(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating users table:', err.message);
                        db.close();
                        return reject(err);
                    }

                    console.log('Database initialized successfully');
                    db.close();
                    resolve();
                });
            });
        });
    });
}

// Define all microservices with their actual paths
const services = [
    { name: "admin-service", path: "./admin-service", port: process.env.ADMIN_PORT || 5001, route: "/api/admin" },
    { name: "client-service", path: "./client-service", port: process.env.CLIENT_PORT || 6001, route: "/api" },
    { name: "user-authentication", path: "./user-authentication", port: process.env.AUTH_PORT || 7002, route: "/api/auth" },
    { name: "llm-driven-booking", path: "./llm-driven-booking", port: process.env.LLM_PORT || 7001, route: "/api/llm" },
];

// Create gateway server to route requests to microservices
function createGateway() {
    const gateway = express();
    gateway.use(express.json());

    // Health check endpoint
    gateway.get('/health', (req, res) => {
        res.json({ status: 'ok', services: services.map(s => s.name) });
    });

    // Proxy routes to microservices
    services.forEach(service => {
        const target = `http://localhost:${service.port}`;
        gateway.use(
            service.route,
            createProxyMiddleware({
                target: target,
                changeOrigin: true,
                logLevel: 'info',
                onError: (err, req, res) => {
                    console.error(`Proxy error for ${service.name}:`, err.message);
                    if (!res.headersSent) {
                        res.status(502).json({ error: `Service ${service.name} unavailable` });
                    }
                }
            })
        );
        console.log(`Gateway route ${service.route} -> ${target}`);
    });

    return gateway;
}

// Main startup function
async function startServices() {
    console.log('Starting all microservices...');
    console.log(`Database path: ${dbPath}`);

    // Initialize database first
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Failed to initialize database:', error.message);
        console.log('Continuing anyway - services may create tables on startup');
    }

    // Track spawned processes
    const processes = [];

    // Wait a bit for services to start before starting gateway
    const startDelay = 2000; // 2 seconds

    // Start each service
    for (const service of services) {
        console.log(`\nStarting ${service.name} on port ${service.port}...`);

        const servicePath = path.resolve(__dirname, service.path);

        // Check if service directory exists
        if (!fs.existsSync(servicePath)) {
            console.error(`Error: Service directory not found: ${servicePath}`);
            continue;
        }

        // Set environment variables for the service
        const env = {
            ...process.env,
            PORT: service.port,
            DATABASE_PATH: dbPath, // Ensure all services use the same database
        };

        // Spawn the service
        const proc = spawn("npm", ["run", "start"], {
            cwd: servicePath,
            stdio: "inherit",
            shell: true,
            env: env
        });

        proc.on('error', (error) => {
            console.error(`Failed to start ${service.name}:`, error.message);
        });

        proc.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                console.error(`${service.name} exited with code ${code}`);
            } else if (signal) {
                console.error(`${service.name} was killed by signal ${signal}`);
            }
        });

        processes.push({ name: service.name, process: proc });
    }

    // Start gateway server after services have started
    setTimeout(() => {
        const gateway = createGateway();
        // Use PORT env var (Railway sets this), or GATEWAY_PORT, or default to 8000 for local dev
        // This avoids conflict with frontend on port 3000
        const gatewayPort = process.env.PORT || process.env.GATEWAY_PORT || 8000;
        gateway.listen(gatewayPort, () => {
            console.log(`\nGateway server running on port ${gatewayPort}`);
            console.log(`   Routes:`);
            services.forEach(s => {
                console.log(`   ${s.route} -> ${s.name} (localhost:${s.port})`);
            });
        });
    }, startDelay);

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down all services...');
        processes.forEach(({ name, process: proc }) => {
            console.log(`Stopping ${name}...`);
            proc.kill('SIGTERM');
        });
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down all services...');
        processes.forEach(({ name, process: proc }) => {
            console.log(`Stopping ${name}...`);
            proc.kill('SIGINT');
        });
        process.exit(0);
    });

    console.log('\nAll services started. Press Ctrl+C to stop.\n');
}

// Start everything
startServices().catch((error) => {
    console.error('Fatal error starting services:', error);
    process.exit(1);
});
