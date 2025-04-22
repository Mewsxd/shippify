import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Full table with pagination control
const PaginatedTable = () => {
  const data = Array.from({ length: 95 }, (_, i) => `Item ${i + 1}`);
  const pageSize = 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const currentData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="p-4">
      <table className="w-full table-auto border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2">Item</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-2">{item}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-center space-x-2 mt-6 flex-wrap">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaginatedTable;
