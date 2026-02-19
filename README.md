# Insurance CRM

A modern Customer Relationship Management (CRM) system tailored for the insurance industry. This application unifies both the frontend and backend logic using [Next.js](https://nextjs.org/) and leverages [Supabase](https://supabase.com/) for database, authentication, and real-time capabilities.

## 🚀 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Email Service:** [Nodemailer](https://nodemailer.com/)
- **CSV Parsing:** [Papa Parse](https://www.papaparse.com/)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Project requires Node v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

You will also need a **Supabase** project set up.

---

## ⚙️ Environment Variables


```

> **Note:** The `SUPABASE_SERVICE_ROLE_KEY` is for server-side operations that require bypassing Row Level Security (RLS). **Never expose this key on the client-side.**

---

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/insurance-crm.git
    cd insurance-crm
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Copy the providing environment variable template or create `.env.local` as shown in the section above.

---

## 🏃‍♂️ Running the Application

This project runs the frontend and backend (API routes) concurrently via Next.js.

### Development Server
To start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production
To build the application for production usage:

```bash
npm run build
```

### Start Production Server
To start the production server after building:

```bash
npm start
```

---

## 📂 Project Structure

- **`/app`**: Contains the application routes (pages) and API routes (backend).
    - **`/api`**: Backend API endpoints reside here.
- **`/components`**: Reusable React components (UI elements).
- **`/lib`**: Utility functions, Supabase client initialization, and shared logic.
- **`/public`**: Static assets like images and fonts.
- **`/types`** (if applicable): TypeScript type definitions.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
