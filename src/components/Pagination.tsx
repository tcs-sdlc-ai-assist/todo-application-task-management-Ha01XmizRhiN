"use client";

import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(page + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination navigation" role="navigation">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
        >
          Previous
        </button>

        <span aria-live="polite" aria-atomic="true" className="text-sm">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLastPage}
          aria-label="Go to next page"
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </nav>
  );
};