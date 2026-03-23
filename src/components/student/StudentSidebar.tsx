'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  User,
  LogOut,
  ArrowLeftRight
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useClass } from '@/contexts/ClassContext';

const navItems = [
  { href: '/student', icon: LayoutDashboard, label: 'Overview' },
  { href: '/student/lessons', icon: BookOpen, label: 'Lessons' },
  { href: '/student/homework', icon: FileText, label: 'Homework' },
  { href: '/student/profile', icon: User, label: 'Profile' },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentClass } = useClass();
  
  const classParam = searchParams.get('class');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getHrefWithClass = (href: string) => {
    return classParam ? `${href}?class=${classParam}` : href;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href={getHrefWithClass('/student')} className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">TutorBoard</span>
        </Link>
      </div>

      {currentClass && (
        <div className="p-4 border-b border-gray-200 bg-green-50">
          <p className="text-xs text-green-600 font-medium mb-1">Current Class</p>
          <p className="font-semibold text-gray-900 truncate">{currentClass.name}</p>
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/student' && pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={getHrefWithClass(item.href)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/classes"
          className="sidebar-link mb-2 text-blue-600 hover:bg-blue-50"
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Switch Class</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
