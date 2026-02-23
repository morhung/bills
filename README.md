# 🍹 Drink Bill Manager

A state-of-the-art, premium web application designed to manage drink bills, track member debts, and simplify payments with VietQR integration. Built with a focus on high-end UI/UX and real-time synchronization.

---

## ✨ Key Features

### 🔍 ChatOps Integration
- **Smart User Suggestions**: Quickly find members via ChatOps autocomplete API.
- **Auto-fill Efficiency**: Automatically populates Tag ID (RFID), ChatOps ID, and Email when a user is selected from ChatOps.
- **Unified User Management**: Seamlessly creates new local system users from ChatOps suggestions.

### 💸 Payments & Finance
- **VietQR Integration**: Automatically generates dynamic QR codes for payments, including bank BIN, account number, amount, and purpose.
- **Debt Tracking**: Clear visibility into total debt, individual bill statuses, and payment history.
- **Daily Summaries**: Intelligent grouping of bills by date with daily totals and status badges.

### 🛡️ Admin Dashboard
- **Comprehensive Management**: Dedicated interface for managing transactions, check-ins, members, and contributions.
- **Sticky Filters & Search**: Persistently accessible filtering system for efficient data navigation.
- **Real-time Synchronization**: Immediate updates across all clients using Supabase Realtime and TanStack Query optimistic updates.

### 💎 Premium UI/UX
- **Modern Aesthetic**: Glassmorphism, mesh gradients, and floating cards.
- **Smooth Interactions**: Powered by Framer Motion and micro-animations for a fluid feel.
- **Responsive Design**: Optimized for both mobile and desktop experiences.

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **State & Data**: [TanStack Query v5](https://tanstack.com/query/latest), [Supabase JS](https://supabase.com/docs/reference/javascript/introduction)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Payment**: [vietnam-qr-pay](https://www.npmjs.com/package/vietnam-qr-pay)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd drink_bill
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Project Structure

- `src/components`: UI components and popup forms.
- `src/hooks`: Custom React hooks (real-time sync, data fetching).
- `src/services`: API service layers (Bill, User, ChatOps, VietQR).
- `src/types`: TypeScript definitions and database schemas.
- `src/utils`: Helper functions and formatting utilities.

---

## 🛡️ Security
This project uses `.gitignore` to ensure sensitive credentials like `.env.local` and `node_modules` are never committed to the repository.
