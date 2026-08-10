# Noors.bd — Premium Luxury Accessories E-Commerce Platform

A production-ready e-commerce platform for women's luxury accessories (bags, rings, earrings, necklaces, watches, sunglasses) tailored for Bangladesh with Cash on Delivery, bKash, and Nagad.

## ✨ Features
- **Modern Luxury E-Commerce**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Redesigned Single Product Page**: Clean 2-column luxury buying stack, interactive image gallery, readable price typography, live stock status, and authentic trust guarantees.
- **Admin Operations Hub (`/admin`)**:
  - Store Customization (Store title, hotline, email, delivery rates inside/outside Dhaka, social channels).
  - Product Catalog Management (Add, Edit, Delete with category & badges).
  - Category Management (Add, Edit, Delete).
  - Order Fulfillment & Status Tracker (Pending, Confirmed, Shipped, Delivered).
  - Promo Discount Coupon Manager.
  - User Role Manager (Super Admin, Admin, Staff, Customer).
  - Sales Analytics & Payment Breakdown (COD, bKash, Nagad).
- **Authentication & Database**:
  - MongoDB connection with Mongoose models.
  - One-Click Test Role logins on `/auth/login` (Super Admin, Admin, Staff, Customer).
  - Live Database Seed API (`/api/seed?force=true`).

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🔐 Default Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@noors.bd` | `admin123` |
| **Admin** | `admin@noors.bd` | `admin123` |
| **Staff (Moderator)** | `staff@noors.bd` | `staff123` |
| **Customer** | `customer@noors.bd` | `customer123` |
