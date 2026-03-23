'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  FolderOpen,
  LogOut,
  Settings,
  ArrowLeftRight,
  Copy,
  Check
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useClass } from '@/contexts/ClassContext';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/lessons', icon: BookOpen, label: 'Lessons' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/homework', icon: FileText, label: 'Homework' },
  { href: '/dashboard/resources', icon: FolderOpen, label: 'Resources' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentClass } = useClass();
  const [copied, setCopied] = useState(false);
  
  const classParam = searchParams.get('class');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const copyJoinCode = () => {
    if (currentClass?.join_code) {
      navigator.clipboard.writeText(currentClass.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getHrefWithClass = (href: string) => {
    return classParam ? `${href}?class=${classParam}` : href;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href={getHrefWithClass('/dashboard')} className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">TutorBoard</span>
        </Link>
      </div>

      {currentClass && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <p className="text-xs text-blue-600 font-medium mb-1">Current Class</p>
          <p className="font-semibold text-gray-900 truncate">{currentClass.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">Code: <span className="font-mono font-bold text-blue-600">{currentClass.join_code}</span></span>
            <button
              onClick={copyJoinCode}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Copy join code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
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
        <Link
          href={getHrefWithClass('/dashboard/settings')}
          className="sidebar-link mb-2"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
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
