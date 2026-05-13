# Sprout - Grow every lesson

A cozy place for guided tutoring—bite-sized learning, gentle check-ins, and room to grow at your pace. Built with Next.js, Fabric.js, and Supabase.

## all Features

### For Teachers
- **Interactive Whiteboard**: Draw, write, and explain concepts with pen, highlighter, shapes, and text tools
- **Math Equation Editor**: Built-in LaTeX support for writing mathematical formulas
- **Lesson Templates**: Graph paper, coordinate planes, and lined paper backgrounds
- **Lesson Management**: Save, organize, and reopen lesson whiteboards
- **Homework System**: Create assignments with due dates and track submissions
- **Student Progress Tracking**: Monitor homework completion rates and identify struggling students
- **Resource Library**: Upload and manage images and PDFs for lessons
- **Lesson Timer**: Built-in timer with break reminders

### For Students
- **Lesson Archive**: Browse and review past lesson whiteboards
- **Annotation Mode**: Add personal notes and highlights to lessons without affecting the original
- **Homework Portal**: View assignments, upload solutions, and track due dates
- **Progress Dashboard**: See completion rates and upcoming deadlines
- **Profile Management**: Update personal information and view statistics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Whiteboard**: Fabric.js
- **Math Rendering**: KaTeX
- **Database & Auth**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
cd whiteboard-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key (optional, for email notifications)
```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase-schema.sql`

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
whiteboard-app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Landing page
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Teacher dashboard
│   │   ├── whiteboard/         # Whiteboard editor
│   │   ├── student/            # Student portal
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── whiteboard/         # Canvas, toolbar, tools
│   │   ├── dashboard/          # Teacher UI components
│   │   ├── student/            # Student UI components
│   │   └── ui/                 # Shared UI components
│   ├── lib/
│   │   ├── supabase.ts         # Database client
│   │   ├── canvas-utils.ts     # Fabric.js helpers
│   │   └── auth.ts             # Auth utilities
│   └── types/                  # TypeScript types
├── public/
│   └── templates/              # Whiteboard template images
├── supabase-schema.sql         # Database schema
└── package.json
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Configure Supabase for Production

1. Update your Supabase project's authentication settings
2. Add your production URL to the allowed redirect URLs
3. Enable email confirmations if desired

## Email Notifications

To enable homework due date reminders:

1. Sign up for [Resend](https://resend.com)
2. Add your API key to `RESEND_API_KEY`
3. Set up a cron job to call `/api/notifications` daily

## License

MIT

## Support

For questions or issues, please open a GitHub issue.
