import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="font-bold text-gray-900 dark:text-gray-100">CareerPilot AI</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Smart Career Management Platform
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#6C63FF] transition-colors">
              Dashboard
            </Link>
            <Link href="/jobs" className="hover:text-[#6C63FF] transition-colors">
              Jobs
            </Link>
            <Link href="/resumes" className="hover:text-[#6C63FF] transition-colors">
              Resumes
            </Link>
            <Link href="/interview-prep" className="hover:text-[#6C63FF] transition-colors">
              Interview Prep
            </Link>
            <Link href="/analytics" className="hover:text-[#6C63FF] transition-colors">
              Analytics
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} CareerPilot AI
          </p>
        </div>
      </div>
    </footer>
  );
}
