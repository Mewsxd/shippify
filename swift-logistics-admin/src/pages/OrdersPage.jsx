// export default OrderTable;
/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { getDeliveriesPage } from "../http/http";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const OrderTable = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [currentCursor, setCurrentCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([null]); // Store cursor history for navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hasClickedSearchButton, setHasClickedSearchButton] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial width
    setContainerWidth(containerRef.current.offsetWidth);

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Determine if we should use table or card view based on container width
  const useTableView = containerWidth >= 768;

  // Pagination and data fetching
  const PAGE_SIZE = 10;

  const { data, isLoading, isError } = useQuery({
    queryFn: () => getDeliveriesPage(currentCursor, search, filter),
    queryKey: ["deliveries", currentCursor, search, filter],
    onSuccess: (data) => {
      // Update total count when we get new data
      if (data?.totalCount) {
        setTotalCount(data.totalCount);
      }
    },
  });

  // Calculate total pages
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  let deliveriesData = data?.deliveries || [];
  const hasNextPage = data?.hasNextPage || false;
  const nextCursor = data?.nextCursor || null;

  const handleSearch = () => {
    setSearch(searchInput);
    // Reset pagination when searching
    setCurrentCursor(null);
    setCurrentPage(1);
    setCursorHistory([null]);
    setHasClickedSearchButton(true);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    // Reset pagination when filtering
    setCurrentCursor(null);
    setCurrentPage(1);
    setCursorHistory([null]);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNextPage) {
      // Add the next cursor to our history
      const newHistory = [...cursorHistory];
      if (nextCursor && !newHistory.includes(nextCursor)) {
        newHistory.push(nextCursor);
      }
      setCursorHistory(newHistory);
      setCurrentCursor(nextCursor);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      // Go back to the previous cursor in our history
      const newPage = currentPage - 1;
      const prevCursor = cursorHistory[newPage - 1]; // Arrays are 0-indexed
      setCurrentCursor(prevCursor);
      setCurrentPage(newPage);
    }
  };

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000); // Convert to milliseconds

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getUTCFullYear();

    return `${month}-${day}-${year}`;
  }

  // if (isError) {
  //   return (
  //     <p className="flex justify-center my-4">
  //       There was an error fetching orders, please try again!
  //     </p>
  //   );
  // }

  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third font-outfit">
        Dashboard
      </div>
      <div className="border h-full overflow-y-hidden border-gray-200 rounded-lg shadow-md bg-white m-4 max-xs:m-2 font-outfit flex flex-col">
        <div className="flex flex-col sm:flex-row gap-4 p-4 max-xs:p-3 w-full">
          <div className="w-full flex flex-col sm:flex-row gap-4 ">
            <div className="relative flex gap-2  min-w-[150px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                placeholder="Search by Order ID"
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 shadow rounded-md text-gray-700 focus:ring-blue-200 focus:border-blue-400 outline-none"
                aria-label="Search orders"
              />
            </div>
            <button
              onClick={handleSearch}
              className="border w-fit bg-text1 px-4 py-2  text-white rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              Search
            </button>
          </div>
          {/* Filter Dropdown */}
          <div className="min-w-[150px] w-fit">
            <select
              className="w-full border px-4 py-2 rounded-md text-gray-700 focus:outline-none focus:ring-blue-200 focus:border-blue-400 outline-0 border-gray-200"
              value={filter}
              onChange={handleFilter}
              aria-label="Filter orders"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* ------ */}
        <div
          ref={containerRef}
          className="w-full mt-2 overflow-y-scroll custom-scrollbar overflow-hidden border-t border-b border-gray-200"
        >
          {useTableView ? (
            // Table view for wider containers
            <div className="w-full flex-grow">
              <table className="w-full min-w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 shadow z-10">
                  <tr className="text-left text-third">
                    <th className="p-3 w-1/5">ORDER NUMBER</th>
                    <th className="p-3 w-1/5 text-center">DATE</th>
                    <th className="p-3 w-1/5">EMAIL</th>
                    <th className="p-3 w-1/5">FACILITY NAME</th>
                    <th className="p-3 w-1/5 text-center">SHIPMENT STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-semibold">
                  {isLoading ? (
                    <tr>
                      <td className="font-semibold pl-4 py-4" colSpan="6">
                        Loading table please wait ...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td className="font-semibold pl-4 py-4" colSpan="6">
                        There was an error fetching orders, please try again!
                      </td>
                    </tr>
                  ) : deliveriesData?.length === 0 ? (
                    <tr>
                      <td className="font-semibold pl-4 py-4" colSpan="6">
                        No orders found
                      </td>
                    </tr>
                  )  : (
                    deliveriesData?.map((order) => (
                      <tr
                        onClick={() => navigate(`/order/${order.id}`)}
                        key={order.id}
                        className="text-left hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="p-3 text-text1 w-1/5 truncate">
                          #{order.orderSerial}
                        </td>
                        <td className="p-3 w-1/5 truncate text-center">
                          {formatTimestamp(Number(order.createdAt?._seconds))}
                        </td>
                        <td className="p-3 w-1/5 truncate">{order?.email}</td>
                        <td className="p-3 w-1/5 truncate">{order?.name}</td>
                        <td className="p-3 w-1/5 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              order.deliveryStatus === "pending"
                                ? "bg-gray-200 text-gray-700"
                                : order.deliveryStatus === "unavailable"
                                ? "bg-red-200 text-red-700"
                                : "bg-green-200 text-green-700"
                            }`}
                          >
                            {order.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Card view for narrower containers
            <div className="w-full flex-grow">
              {isLoading ? (
                <div className="p-4 font-semibold">
                  Loading table please wait ...
                </div>
              ) : deliveriesData?.length === 0 ? (
                <div className="p-4 font-semibold">No orders found</div>
              ) : (
                deliveriesData?.map((order) => (
                  <div
                    onClick={() => navigate(`/order/${order.id}`)}
                    key={order.id}
                    className="border-b border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">
                        ORDER NUMBER
                      </div>
                      <div className="font-semibold text-text1 break-words">
                        #{order.orderSerial}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">DATE</div>
                      <div className="font-semibold break-words">
                        {formatTimestamp(Number(order.createdAt?._seconds))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">EMAIL</div>
                      <div className="font-semibold break-words">
                        {order?.email}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">
                        FACILITY NAME
                      </div>
                      <div className="font-semibold break-words">
                        {order?.name}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">
                        SHIPMENT STATUS
                      </div>
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            order.deliveryStatus === "pending"
                              ? "bg-gray-200 text-gray-700"
                              : order.deliveryStatus === "unavailable"
                              ? "bg-red-200 text-red-700"
                              : "bg-green-200 text-green-700"
                          }`}
                        >
                          {order.deliveryStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} {totalPages > 0 ? `of ${totalPages}` : ""}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isLoading}
              className={`flex items-center justify-center px-3 py-1 border rounded-md ${
                currentPage <= 1 || isLoading
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className={`flex items-center justify-center px-3 py-1 border rounded-md ${
                !hasNextPage || isLoading
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderTable;
