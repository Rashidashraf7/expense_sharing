# Expense Sharing Backend System (CredResolve)

##  Project Overview

The **Expense Sharing Backend System (CredResolve)** is a RESTful backend application inspired by platforms like **Splitwise**.

It allows users to:
- Create groups
- Add shared expenses
- Track balances
- Settle dues efficiently

The system supports multiple expense split strategies and automatically tracks **who owes whom**, while also providing **simplified balances** to minimize the number of transactions.

---

##  Tech Stack

- **Backend Framework:** Node.js, Express.js  
- **Database:** PostgreSQL  
- **Database Driver:** pg  
- **Validation:** express-validator  
- **Environment Management:** dotenv  

---

##  Supported Expense Split Types

### 1️ Equal Split
- Expense is divided equally among all participants.

### 2️ Exact Amount Split
- Each participant pays a fixed amount.

### 3️ Percentage Split
- Expense is divided based on percentage contribution.

---

## Project Architecture

The project follows a **layered architecture** for scalability and maintainability.

### Architecture Layers
- **Routes Layer:** Handles HTTP requests  
- **Service Layer:** Contains business logic  
- **Utility Layer:** Handles split calculations  
- **Database Layer:** PostgreSQL for persistent storage

# Setup Instructions
### Clone the Repository
- git clone <your-repository-url>
- cd CredResolve

### Install Dependencies
-npm install

### Configure Environment Variables

 -Create a .env file in the root directory:

- PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=rashid
DB_NAME=expense_sharing
DB_PORT=5432

4️⃣ Start the Server
npm run dev


Server will start at:

http://localhost:3000 

#  APIs END POINTS

### User APIs
| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| POST   | `/users`         | Create a new user |
| GET    | `/users/:userId` | Get user details  |

### Group APIs
| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| POST   | `/groups`                  | Create a group           |
| POST   | `/groups/:groupId/members` | Add member to group      |
| GET    | `/groups/user/:userId`     | Get all groups of a user |

### Expense APIs
| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| POST   | `/expenses`                | Add shared expense      |
| GET    | `/expenses/group/:groupId` | Get expenses of a group |


### Balance APIs
| Method | Endpoint                              | Description             |
| ------ | ------------------------------------- | ----------------------- |
| GET    | `/balances/group/:groupId`            | Get raw balances        |
| GET    | `/balances/group/:groupId/simplified` | Get simplified balances |

### Settlement APIs
| Method | Endpoint                              | Description             |
| ------ | ------------------------------------- | ----------------------- |
| GET    | `/balances/group/:groupId`            | Get raw balances        |
| GET    | `/balances/group/:groupId/simplified` | Get simplified balances |














