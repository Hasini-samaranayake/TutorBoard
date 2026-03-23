import Link from 'next/link';
import { BookOpen, Pencil, Users, Clock, FileText, BarChart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">TutorBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Interactive Whiteboard
            <span className="text-blue-600"> Built for Tutors</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Deliver engaging online lessons with a powerful whiteboard designed specifically 
            for private tutoring. Draw, write equations, manage homework, and track student progress 
            all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Start Teaching
            </Link>
            <Link
              href="/auth/register"
              className="bg-white text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg border border-gray-200"
            >
              Join as Student
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Pencil className="w-6 h-6" />}
            title="Intuitive Drawing Tools"
            description="Pen, highlighter, shapes, and eraser. Everything you need to explain concepts visually."
          />
          <FeatureCard
            icon={<span className="text-lg font-bold">∑</span>}
            title="Math Equation Editor"
            description="Built-in LaTeX support for writing beautiful mathematical formulas and equations."
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Lesson Templates"
            description="Graph paper, coordinate planes, and lined paper templates ready to use."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Student Profiles"
            description="Each student has their own profile to access lessons, submit homework, and track progress."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Lesson Timer"
            description="Built-in timer with break reminders to keep your lessons on track."
          />
          <FeatureCard
            icon={<BarChart className="w-6 h-6" />}
            title="Progress Tracking"
            description="Monitor homework completion and identify students who need extra help."
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Designed for Mathematics Tutoring
              </h2>
              <p className="text-gray-600 mb-6">
                Unlike generic whiteboard tools, TutorBoard is built from the ground up for 
                tutors. With math-first features like equation editors, graph paper templates, 
                and coordinate planes, you can focus on teaching instead of fighting with tools.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Save and reopen lesson boards anytime
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Students can annotate lessons without changing the original
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Automatic homework due date reminders
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-2" />
                <p>Whiteboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-gray-200 mt-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">TutorBoard</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built for tutors, by tutors.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
