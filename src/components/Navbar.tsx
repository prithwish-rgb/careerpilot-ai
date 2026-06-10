"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Briefcase, 
  FileText, 
  BarChart3, 
  Brain, 
  Menu,
  X
} from "lucide-react";

export function Navbar() {
const { data: session, status } = useSession();
const pathname = usePathname();
const isSigninPage = pathname === "/auth/signin";
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

const [loading, setLoading] = useState(false);

const handleSignIn = async () => {
    setLoading(true);
    await signIn(); // redirects to provider login
    setLoading(false);
  };

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Resumes", href: "/resumes", icon: FileText },
  { name: "Interview Prep", href: "/interview-prep", icon: Brain },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-gradient-to-r from-[#6C63FF]/90 via-[#00C9A7]/90 to-[#6C63FF]/90 shadow-lg border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white tracking-wide">
          ResumeIQ
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          {session && (
            <div className="flex gap-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex gap-4 items-center">
          {status === "loading" ? (
            <span className="text-white/80">Loading...</span>
          ) : session ? (
            <>
              <span className="hidden sm:inline text-white/90 font-medium">
                Welcome, {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all shadow-sm"
              >
                Sign Out
              </button>
            </>
          ) : null}

          {/* Mobile Menu Button */}
          {session && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && session && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-white/10">
          <div className="px-6 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#6C63FF]/10 text-[#6C63FF]"
                      : "text-gray-700 hover:text-[#6C63FF] hover:bg-[#6C63FF]/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}