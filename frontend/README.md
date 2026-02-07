# Mobile Shop Genius

This project is a Mobile Shop Management System built with React, Vite, Tailwind CSS, and Shadcn UI. It uses a custom Node.js/Express backend with MongoDB.

## Features

-   **Dashboard**: Overview of sales, stock, and customers.
-   **POS (Point of Sale)**: Create invoices and manage sales.
-   **Products**: Manage inventory, stock levels, and pricing.
-   **Customers**: Maintain customer records.
-   **Invoices**: View and print past invoices.
-   **EMI**: Manage EMI plans and payments.
-   **Suppliers**: Manage supplier details.
-   **Settings**: Configure shop details.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB
-   **Authentication**: Custom JWT Auth

## Getting Started

### Backend

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Set up your `.env` file (see `.env.example` or create one with `PORT`, `MONGO_URI`, `JWT_SECRET`).
4.  Start the server: `npm run dev`

### Frontend

1.  Navigate to the root directory.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

## Deployment

Build the frontend for production:
```sh
npm run build
```
