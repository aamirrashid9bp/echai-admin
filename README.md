# echaii - POS & Business Management Admin Panel

An internal Point of Sale (POS) and Enterprise Resource Planning / Business Operations Admin Panel built specifically for **echaii**.

---

## ☕ Key Features

1. **Dashboard**
   - Live KPI cards: Today's Sales, Revenue, Total Expenses, Net Profit.
   - Operational telemetry: Total Stock, Purchased Today, Cups Sold Today, Wastage Today.
   - 4 Dynamic Recharts: Revenue Trends, Cups Sold Volume, Expense Category Donut, Profit vs Revenue vs Expenses.
   - Location performance summary and real-time transaction feeds.

2. **POS / Sales**
   - High-speed daily counter entry form: Location, Date, Cups Sold (with quick presets `+10`, `+25`, `+50`, `+100`), Selling Price / Cup, and auto-calculated Total Revenue (`Cups × Price`).
   - Today's sales summary and full searchable/filterable ledger.
   - View, edit, and delete transactions with instant calculation cascade.

3. **Inventory Management**
   - Reconciled stock formula: `Closing Stock = Opening Stock + Purchased Cups - Sold Cups - Wastage`.
   - Low stock threshold visual alert.
   - Fast `+ Add Stock` and `+ Record Wastage` workflows.

4. **Purchases & Vendor Procurement**
   - Track cup procurement orders from vendors.
   - Auto calculation: `Total Amount = Cups Purchased × Unit Price / Cup`.
   - Integrated into inventory intake and expense telemetry.

5. **Operational Expense Tracker**
   - Standardized categories: *Chai Cost*, *Cup Cost*, *Tissue Cost*, *Travelling / Transport*, *Other Expenses*.
   - Filterable ledger with automated category totals.

6. **Net Profit & Margin Analysis**
   - Dedicated financial formula: `Net Profit = Total Revenue - Total Expenses` & `Margin = (Net Profit / Revenue) × 100`.
   - Time-series margin comparison chart and outlet-by-outlet profitability table.

7. **Location & Outlet Management**
   - Add/edit office outlets and corporate kiosks.
   - Deep-dive Location Detail page with per-outlet sales, purchases, expenses, and inventory logs.

8. **Reports & Audit Generator**
   - Custom date, daily, weekly, and monthly reports.
   - One-click Print, PDF download, and CSV export.

9. **Invoices & Corporate Billing**
   - Auto-generated serial invoice numbering (`ECH-YYYYMM-XXXX`).
   - Dynamic line items with subtotal, tax/GST, discount, and total.
   - Formal printable tax invoice layout with authorized signatory section.

10. **Role-Based Access Control (RBAC)**
    - **Admin:** Complete access to all 11 modules, User Management, and Settings.
    - **Manager:** Access to Dashboard, POS, Inventory, Purchases, Expenses, Profit, Locations, Reports, Invoices.
    - **Staff:** Fast POS and invoice generation.

11. **Settings & Database Configuration**
    - Brand details, GSTIN, default cup pricing, stock thresholds, and live Supabase sync status.

---

## 🚀 Getting Started

### 1. Run the Application Locally
```bash
cd echaii-admin
npm install
npm run dev
```

The admin panel runs on `http://localhost:5174/`.

### 2. Connect to Supabase Backend
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Insert your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Open your Supabase project dashboard, navigate to the **SQL Editor**, and run the schema file located at:
   ```
   src/lib/supabase_schema.sql
   ```
4. All tables (`sales`, `inventory`, `purchases`, `expenses`, `locations`, `invoices`, `invoice_items`, `profiles`, `business_settings`), triggers, and Row Level Security (RLS) policies will be created automatically.
