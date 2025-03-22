# Teacher-Student Tracker

A web application for tracking and managing teacher-student relationships and educational progress. Built with Next.js, Chakra UI, and Supabase.

## Features

- Teacher and student account management
- Progress tracking for students
- Performance analytics and reporting
- Interactive dashboard
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, Chakra UI
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Emotion, Chakra UI, TailwindCSS
- **Charts**: Recharts
- **Form Handling**: React Hook Form
- **Type Safety**: TypeScript

## Prerequisites

- Node.js 18+
- npm or Yarn
- Supabase account

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/omer-kirac/teacher-student-tracker.git
   cd teacher-student-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Setup environment variables
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app`: Next.js app router pages and layouts
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and shared code
- `/src/db`: Database schemas and type definitions
- `/public`: Static assets

## Deployment

This application can be deployed on Vercel, Netlify, or any other platform that supports Next.js.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
