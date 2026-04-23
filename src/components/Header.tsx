"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    closeMobileMenu();
    logout();
  }, [logout, closeMobileMenu]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
        menuButtonRef.current?.focus();
      }
    },
    [isMobileMenuOpen, closeMobileMenu]
  );

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, handleKeyDown]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm" role="banner">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 no-underline transition-colors hover:text-blue-600"
            aria-label="Todo App - Go to home page"
          >
            <span aria-hidden="true">✅</span> Todo App
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-4 md:flex"
        >
          {isAuthenticated ? (
            <>
              <Link
                href="/tasks"
                className="text-sm font-medium text-gray-700 no-underline transition-colors hover:text-blue-600"
              >
                My Tasks
              </Link>
              <span
                className="text-sm text-gray-500"
                aria-label={`Logged in as ${user?.email}`}
              >
                {user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Log out"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white no-underline shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:hidden"
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden"
        >
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-2">
                <p
                  className="text-sm text-gray-500"
                  aria-label={`Logged in as ${user?.email}`}
                >
                  {user?.email}
                </p>
              </div>
              <Link
                href="/tasks"
                onClick={closeMobileMenu}
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-blue-600"
              >
                My Tasks
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Log out"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white no-underline shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;