# TigerTix

## Project Overview

*TigerTix* is a full-stack, microservices-driven ticket-booking platform designed to help Clemson students, faculty, and residents find events on Clemson's campus. This application uses a React.js frontend communicating with multiple Node.js/Express backend microservices, all connected through a shared SQLite database.

**Features:**
- Event creation and management
- Event browsing and ticket purchases
- User authentication
- LLM-driven natural language ticket booking
- Automated regression testing

## Tech Stack

**Frontend:**
- React.js
- Axios
- Semantic HTML + ARIA Accessibility

**Backend:**
- Node.js
- Express.js
- SQLite3
- LLM Integration via OpenAI-style API calls

## Architecture Summary

*TigerTix* employs a microservices architecture, where independent backend services communicate via REST APIs and share a single SQLite database (`backend/shared-db/database.sqlite`). Schema initialization scripts are located in `backend/shared-db/init.sql`.

*For more info on architecture and architecture diagram go to* [here](more_info/Architecture.md)

### Servers

| Server | Port | Use |
|:---:|:---:|:---:|
| Admin Service | 5001 | Create/update events & write operations |
| Client Service | 6001 | Validate/purchase tickets & list events |
| LLM Booking Service | 7001 | Natural language into booking actions |
| User Authentication Service | 7002 | Login/registration functionality |
| Frontend | 3000 | User Interface |

### Data Flow

Admin Service inserts or updates events and writes to the shared SQLite DB. Client Service reads events and processes ticket purchases using transactions. LLM Service receives user prompts and calls Client/Admin APIs. Frontend fetches data directly from microservices depending on the user.

*For more info on dataflow and dataflow diagram go to* [here](more_info/Architecture.md)

## Setup Instructions

### Requirements
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/ianray9/tiger-tix.git
cd tiger-tix
```

### 2. Install Dependencies

**Backend Dependencies:**
```bash
cd backend
npm install
```

**Frontend Dependencies:**
```bash
cd frontend
npm install
```

### 3. Run the Services

#### Option A: Run Microservices Separately

Start the following services in separate terminals:

**Admin Service:**
```bash
cd backend/admin-service
npm start
```

**Client Service:**
```bash
cd backend/client-service
npm start
```

**LLM Booking Service:**
```bash
cd backend/llm-driven-booking
npm start
```

**User Authentication Service:**
```bash
cd backend/user-authentication
npm start
```

**React Frontend:**
```bash
cd frontend
npm start
```

#### Option B: Run Through Gateway

Set the `REACT_APP_BACKEND_URL` environment variable to the gateway port:
```bash
export REACT_APP_BACKEND_URL="http://localhost:8000"
```

Start the backend gateway:
```bash
cd backend
npm start
```

Start the React frontend:
```bash
cd frontend
npm start
```

### 4. Run Tests

To run the regression tests for the backend:
```bash
cd backend
npm test
```

## Environment Variables

Each microservice has environment variables that can be configured for non-local deployment. Create `.env` files as follows:

**Admin Service** (`backend/admin-service/.env`):
```
PORT=5001
DB_PATH=../shared-db/database.sqlite
```

**Client Service** (`backend/client-service/.env`):
```
PORT=6001
DB_PATH=../shared-db/database.sqlite
```

**LLM Booking Service** (`backend/llm-driven-booking/.env`):
```
PORT=7001
OPENAI_API_KEY=<not set> (with fallback to Regex parsers if no key)
CLIENT_SERVICE_URL=http://localhost:6001
ADMIN_SERVICE_URL=http://localhost:5001
```

**Frontend** (`frontend/.env`):
```
REACT_APP_CLIENT_URL=http://localhost:6001/api
REACT_APP_ADMIN_URL=http://localhost:5001/api
REACT_APP_LLM_URL=http://localhost:7001/api
REACT_APP_BACKEND_URL=<not set>
```

## Team

### Members

| Name | Role |
|:---:|:---:|
| Ian Rayburn | Scrum Master/Full-stack Developer |
| Josue Montalban Cortez | Full-stack Developer |
| Allan Cruz | Full-stack Developer |

**Instructor:** Dr. Julian Brinkley

**TAs:** Colt Doster & Atik Enam

## Demo Video

[View Demo Video](https://drive.google.com/file/d/1OzKLM4sHKK7SZtNZ9w3RXOEhx5MikaDh/view?usp=sharing)

## License

This project is released under the MIT License. For more information, visit: https://choosealicense.com/licenses/mit/.
