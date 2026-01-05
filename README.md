# QFS Crypto Wallet API 💳

## Overview
A robust financial backend engine built with Node.js and Express, designed to handle multi-cryptocurrency asset management, secure swap executions, and administrative transaction auditing. The system utilizes Mongoose for complex data modeling of wallets, transactions, and role-based access controls.

## Features
- Node.js & Express: Core API architecture for high-concurrency request handling.
- Mongoose: Advanced NoSQL schema modeling for multi-asset wallet balances and audit trails.
- JWT & Bcrypt: Secure authentication flow with granular role-based access control (RBAC).
- Multer: Automated storage engine for KYC document processing and verification.
- Express-Validator: Strict middleware-level data sanitization and schema enforcement.

## Getting Started
### Installation
1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory.
4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qfs_wallet
JWT_SECRET=your_complex_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development

## API Documentation
### Base URL
`http://localhost:5000/api`

### Endpoints

#### POST /auth/register
**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "user@example.com" },
    "token": "ey..."
  }
}
```
**Errors**:
- 400: Validation failed or email already in use

#### POST /auth/login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "token": "ey..." }
}
```
**Errors**:
- 401: Invalid credentials

#### GET /wallet/balance
**Request**:
`Authorization: Bearer [token]`
**Response**:
```json
{
  "success": true,
  "data": {
    "totalValue": 1500.50,
    "balances": [
      { "cryptocurrency": "bitcoin", "balance": 0.5, "symbol": "BTC" }
    ]
  }
}
```

#### POST /wallet/deposit/request
**Request**:
```json
{
  "amount": 500.00,
  "cryptocurrency": "bitcoin",
  "txHash": "0x123..."
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": "TX...",
    "depositAddress": "bc1..."
  }
}
```

#### POST /wallet/withdraw/request
**Request**:
```json
{
  "amount": 100.0,
  "cryptocurrency": "ethereum",
  "toAddress": "0xABC..."
}
```
**Response**:
```json
{
  "success": true,
  "message": "Withdrawal request submitted"
}
```

#### POST /swap/execute
**Request**:
```json
{
  "fromCrypto": "bitcoin",
  "toCrypto": "tether",
  "amount": 50.0
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "swap": { "from": "bitcoin", "to": "tether", "amount": 50 }
  }
}
```

#### POST /kyc/upload
**Request**:
`Content-Type: multipart/form-data`
`document: [File Binary]`
`documentType: national_id`
`documentNumber: 123456`
**Response**:
```json
{
  "success": true,
  "message": "KYC document uploaded successfully"
}
```

#### POST /wallet/link
**Request**:
```json
{
  "walletName": "MetaMask",
  "phrase": "word1 word2 ... word12"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "walletName": "MetaMask" }
}
```

#### GET /admin/transactions/deposits/pending
**Request**:
`Authorization: Bearer [AdminToken]`
**Response**:
```json
{
  "success": true,
  "data": { "deposits": [...], "count": 5 }
}
```

#### PUT /admin/transactions/deposits/:id/confirm
**Request**:
`Params: id`
**Response**:
```json
{
  "success": true,
  "message": "Deposit confirmed successfully"
}
```

#### PUT /admin/kyc/:id/verify
**Request**:
`Params: id`
**Response**:
```json
{
  "success": true,
  "message": "KYC verified successfully"
}
```

**General Errors**:
- 401: Unauthorized - Token missing or invalid
- 403: Forbidden - Admin access required
- 404: Resource not found
- 500: Internal Server Error

## Usage
The API is structured to handle the lifecycle of a crypto wallet user. 
1. **Authentication**: Users register and receive a JWT. All subsequent requests (except login/register) require this token in the header.
2. **Wallet Management**: Users can view balances across 9 supported assets. Deposits and withdrawals are submitted as "pending" requests for administrative oversight.
3. **Internal Swaps**: The system supports 1:1 USD-value swaps between supported assets, instantly updating the wallet balances.
4. **KYC Compliance**: Users must upload identification documents which admins review via the `/admin` routes.
5. **Administration**: Admins have exclusive access to confirm transactions, verify KYC, and manage the system's global deposit addresses.

## Technologies Used

| Technology | Link |
| :--- | :--- |
| Node.js | [https://nodejs.org/](https://nodejs.org/) |
| Express.js | [https://expressjs.com/](https://expressjs.com/) |
| MongoDB | [https://www.mongodb.com/](https://www.mongodb.com/) |
| Mongoose | [https://mongoosejs.com/](https://mongoosejs.com/) |
| JWT | [https://jwt.io/](https://jwt.io/) |
| Multer | [https://github.com/expressjs/multer](https://github.com/expressjs/multer) |

## Author Info
**Project Lead Backend Engineer**
- GitHub: [https://github.com/yourusername]
- LinkedIn: [https://linkedin.com/in/yourprofile]

---

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)