# Royal Food - Restaurant Management System

A comprehensive restaurant management system built with Next.js, TypeScript, PostgreSQL, and Prisma ORM. Royal Food helps restaurant owners track inventory, manage employees, process orders, calculate costs, and monitor partnership profits.

## 🚀 Features

### Management Features (Priority 1)
- **Dashboard**: Real-time overview of key metrics, recent orders, and low stock alerts
- **Inventory Management**: Track stock levels, manage suppliers, record purchases
- **Cost Tracking**: Monitor food costs, employee expenses, and operational costs
- **Employee Management**: Staff records, attendance tracking, payroll management
- **Sales Tracking**: Record daily sales, payment methods, and revenue analysis
- **Partnership Management**: Automated profit sharing between partners (40/60 split)

### Customer Features (Future Implementation)
- **Menu Management**: Digital menu with pricing and availability
- **Order System**: Customer ordering with item selection and pricing
- **Order Tracking**: Real-time order status updates

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

## 📊 Database Schema

The system includes comprehensive database models for:
- User authentication and roles
- Partnership and profit sharing
- Employee management and payroll
- Inventory and supplier management
- Order and sales processing
- Expense tracking and categorization

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18.x or later
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd royal-food
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file and configure:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages and layout
│   ├── inventory/         # Inventory management pages
│   ├── orders/            # Order management pages
│   └── ...
├── components/            # Reusable React components
│   └── layout/           # Layout components (Sidebar, Header)
├── lib/                  # Utility libraries
│   └── prisma.ts        # Database connection
└── ...
```

## 🔧 Development Tasks

The project includes VS Code tasks for common development operations:

- **Start Development Server**: `npm run dev`
- **Build Project**: `npm run build`
- **Run Tests**: `npm test`

## 📈 Usage Guide

### Dashboard Overview
- Monitor daily revenue, orders, and key performance indicators
- Track low stock items that need reordering
- View partnership profit distribution

### Inventory Management
- Add new items with supplier information
- Record daily stock additions and usage
- Set reorder levels for automatic alerts
- Calculate food costs for menu items

### Partnership Features
- Automatic profit calculation and distribution
- Monthly partnership reports
- Configurable profit sharing percentages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Note**: This system prioritizes management functionality to help track daily restaurant operations immediately. Customer ordering features will be implemented in future releases.
