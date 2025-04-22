import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { getAllDeliveries, getAllDrivers } from "../http/http";
import { useNavigate } from "react-router-dom";

const AllDrivers = () => {
  const [search, setSearch] = useState("");
  const [containerWidth, setContainerWidth] = useState(0);
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

  // ////////

  const {
    data: deliveriesData,
    isLoading,
    isError,
  } = useQuery({
    queryFn: getAllDrivers,
    queryKey: ["all-drivers"],
  });
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Search function (excludes shipment status)
  const searchOrders = (orders, searchTerm) => {
    if (!orders) return [];
    if (!searchTerm) return orders;

    const term = searchTerm.toLowerCase();

    return orders.filter(
      (order) =>
        order.id?.toString().toLowerCase().includes(term) || // ✅ Match even partial Order ID
        order.email?.toLowerCase().includes(term) ||
        order.name?.toLowerCase().includes(term)
      // order.isActive?.toLowerCase().includes(term)
    );
  };

  // Filter function (only filters by shipment status)
  const filterOrders = (orders, filter) => {
    if (!orders) return [];
    if (!filter) return orders;

    return orders.filter(
      (order) => order.deliveryStatus?.toLowerCase() === filter.toLowerCase()
    );
  };

  // Combined logic
  const filteredOrders = filterOrders(searchOrders(deliveriesData, search));
  // if (isError) {
  //   return (
  //     <p className=" flex justify-center my-4">
  //       There was an error fetching orders, please try again!
  //     </p>
  //   );
  // }
  return (
    <>
      <div className=" text-2xl font-bold px-6 pt-6 text-third font-outfit">
        Our Drivers
      </div>
      <div className="border h-full overflow-y-hidden border-gray-200 rounded-lg shadow-md bg-white m-4 max-xs:m-2 font-outfit flex flex-col">
        <div className="flex flex-wrap flex-none gap-4 items-center p-4 max-xs:p-3 w-full">
          {/* Search Input Container */}
          <div className="relative flex-grow min-w-[150px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Email, Date, Status..."
              value={search}
              onChange={handleSearch}
              className=" pl-10 pr-4 py-2 border border-gray-200 shadow rounded-md text-gray-700 focus:ring-blue-200 focus:border-blue-400 outline-none"
              aria-label="Search orders"
            />
          </div>
        </div>
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
                    <th className="p-3 w-1/3">DRIVER ID</th>
                    <th className="p-3 w-1/3">EMAIL</th>
                    <th className="p-3 w-1/3">DRIVER NAME</th>
                    {/* <th className="p-3 w-1/4 text-center">DRIVER STATUS</th> */}
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
                        There was an error fetching drivers, please try again!
                      </td>
                    </tr>
                  ) : filteredOrders?.length === 0 ? (
                    <tr>
                      <td className="font-semibold pl-4 py-4" colSpan="6">
                        No driver found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders?.map((order) => (
                      <tr
                        onClick={() => navigate(`/drivers/${order.id}`)}
                        key={order.id}
                        className="text-left hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="p-3 text-text1 w-1/3 truncate">
                          #{order.id}
                        </td>
                        <td className="p-3 w-1/3 truncate">{order?.email}</td>

                        <td className="p-3 w-1/3 truncate">{order?.name}</td>

                        {/* <td className="p-3 w-1/4 truncate text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              order?.isActive
                                ? "bg-green-200 text-green-700"
                                : "bg-red-200 text-red-700"
                            }`}
                          >
                            {order?.isActive ? "Active" : "Inactive"}
                          </span>
                        </td> */}
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
              ) : filteredOrders?.length === 0 ? (
                <div className="p-4 font-semibold">No driver found</div>
              ) : (
                filteredOrders?.map((order) => (
                  <div
                    onClick={() => navigate(`/drivers/${order.id}`)}
                    key={order.id}
                    className="border-b border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">Driver ID</div>
                      <div className="font-semibold text-text1 break-words">
                        #{order.id}
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
                        DRIVER NAME
                      </div>
                      <div className="font-semibold break-words">
                        {order?.name}
                      </div>
                    </div>
                    {/* <div className="grid grid-cols-2 max-xs:grid-cols-1 gap-2 mb-3">
                      <div className="font-medium text-gray-500">
                        DRIVER STATUS
                      </div>
                      <div className="font-semibold break-words">
                        {order?.isActive}
                      </div>
                    </div> */}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllDrivers;
