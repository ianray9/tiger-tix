# TigerTix
## Project Overview
TigerTix is a full-stack, microservices-driven ticket-booking platform designed to help Clemson students, faculty, and residents find events on Clemson's campus. This application used a React.js frontend communicating with multiple Node.js/Express backend microservices, all connected through a shared SQLite database. TigerTix allows for:
- Event creation and management
- Event browsing and ticket purchases
- User authentication
- LLM-driven natural-language ticket booking
- Automated regression testing
## Tech Stack
Frontend:
- React.js
- Axios
- Semantic HTML + ARIA Accessibility

Backend:
- Node.js
- Express.js
- SQLite3
- LLM Integration via OpenAI-style API calls
## Architecture Summary
TigerTix employs a microservices architecture, where independent backend services communicate via REST APIs and share a single SQLite database (backend/shared-db/database.sqlite). Schema initialisation scripts live in: backend/shared-db/init.sql. 

Servers:
|Server|Port|Use|
|---|:---:|:---:|
| Admin Service | 5001 | Create/update events & write operations |
| Client Service | 6001 | Validate/Purchase tickets & List events  |
| LLM Booking Service | 7001 | Natural Langauge into booking actions |
| User Authentication Service | Varies | Login/registration functionality |
| Frontend| 5173 | User Interface |

Data flow: 

Admin Service inserts or updates events and writes to the shared SQLite DB. Client Service reads events and processes ticket purchases using transactions. LLM Service receives user prompts and calls Client/Admin APIs. Frontend fetches data directly from microservices depending on the user.
## Installation & Setup Instructions
1. Clone or unzip the project:
    1. git clone <repo-url>
    2. cd tiger-tix-main
       
2. Install dependencies:
  - At project root:
    - npm install
      
  - Then install for each backend microservice:
    - cd backend/admin-service -> npm install
    - cd ../client-service -> npm install
    - cd ../llm-driven-booking -> npm install
    - cd ../user-authentication -> npm install
      
  - Install frontend dependencies:
    - cd frontend:
      - npm install
        
3. Initialise the database:
  - Run the migration script:
    - cd backend/shared-db
      - node init.js

4. Run the Services:
    1. Start Admin Service
      - cd backend/admin-service
      - node server.js
        
    2. Start Client Service
      - cd backend/client-service
      - node server.js
        
    3. Start LLM Booking Service
      - cd backend/llm-driven-booking
      - node server.js
        
    4. Start User Auth Service
      - cd backend/user-authentication
      - node server.js
        
    5. Start React Frontend
      - cd frontend
      - npm run dev
## Environment Variables Setup
## How to run regression tests
## Team Members, Instructor, TAs, and roles
## License
