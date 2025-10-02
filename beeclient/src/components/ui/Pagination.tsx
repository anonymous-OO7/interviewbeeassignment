import React from "react";

interface PaginationProps {
  totalPosts: number;
  postsPerPage: number;
  setCurrentPage: (page: number) => void;
  currentPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  totalPosts,
  postsPerPage,
  setCurrentPage,
  currentPage,
}) => {
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const windowSize = 4;
    let start = 1;
    let end = windowSize;

    if (currentPage > Math.floor(windowSize / 2)) {
      start = currentPage - Math.floor(windowSize / 2);
      end = start + windowSize - 1;
    }

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    const pages: (number | string)[] = [];

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      pages.push("...");
    }

    return pages;
  };

  return (
    <div className="w-[70%] mx-auto">
      <div className="flex justify-center items-center gap-3 mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous"
          className="px-4 py-2 text-xs font-poppins rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 transition-all disabled:text-gray-300 disabled:bg-white disabled:border-gray-200 flex items-center"
        >
          <span className="mr-1">&lt;</span> Previous
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-base text-gray-500 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page as number)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`w-4 h-4 p-3 text-xs font-poppins rounded-full flex items-center justify-center font-medium transition-all
                ${
                  page === currentPage
                    ? "bg-gray-900 text-white"
                    : "bg-transparent text-gray-900 hover:bg-gray-100"
                }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next"
          className="px-4 py-2  text-xs font-poppins rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 transition-all disabled:text-gray-300 disabled:bg-white disabled:border-gray-200 flex items-center"
        >
          Next <span className="ml-1">&gt;</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
