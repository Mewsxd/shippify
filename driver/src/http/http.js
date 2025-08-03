export const SERVER_URL = "http://localhost:3000";
// export const SERVER_URL = "https://shippify.onrender.com";

export const getAllDeliveries = async () => {
  try {
    const req = await fetch(
      SERVER_URL + "/api/deliveries/getUnAssignedDeliveries",
      {
        credentials: "include",
      }
    );
    const res = await req.json();
    return res.deliveries;
  } catch (error) {
    console.error(error);
  }
};

export const getUnAssignedDeliveries = async (
  cursor = null,
  searchTerm = "",
  statusFilter = ""
) => {
  // console.log("Fetching deliveries with cursor:", cursor);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    if (searchTerm) params.append("orderSerial", searchTerm);
    if (statusFilter) params.append("status", statusFilter);
    // console.log(
    //   SERVER_URL +
    //     `/api/deliveries/getUnAssignedDeliveries?${params.toString()}`
    // );
    const response = await fetch(
      SERVER_URL +
        `/api/deliveries/getUnAssignedDeliveries?${params.toString()}`
    );

    if (!response.ok) {
      // console.log("Response not ok:", response.statusText);

      throw new Error("Failed to fetch deliveries");
    }

    const data = await response.json();
    // console.log(data);

    return {
      deliveries: data.deliveries,
      nextCursor: data.nextCursor,
      hasNextPage: data.hasNextPage,
      totalCount: data.totalCount,
    };
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    throw error;
  }
};

export const getUserDeliveries = async (
  cursor = null,
  searchTerm = "",
  statusFilter = "",
  id
) => {
  // console.log("Fetching deliveries with cursor:", cursor);
  // console.log(
  //   "Cursor",
  //   cursor,
  //   "Search term",
  //   searchTerm,
  //   "Status",
  //   statusFilter,
  //   "Id",
  //   id
  // );

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    if (searchTerm) params.append("orderSerial", searchTerm);
    if (statusFilter) params.append("deliveryStatus", statusFilter);
    // console.log(
    //   SERVER_URL + "/api/deliveries/user/" + id + `?${params.toString()}`
    // );

    const response = await fetch(
      SERVER_URL + "/api/deliveries/user/" + id + `?${params.toString()}`
    );

    if (!response.ok) {
      // console.log("Response not ok:", response.statusText);

      throw new Error("Failed to fetch deliveries");
    }

    const data = await response.json();
    // console.log("line 98", data);

    return {
      deliveries: data.deliveries,
      nextCursor: data.nextCursor,
      hasNextPage: data.hasNextPage,
      totalCount: data.totalCount,
    };
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    throw error;
  }
};

export const getAllDeliveriesByUserId = async (id) => {
  try {
    const req = await fetch(SERVER_URL + "/api/deliveries/user/" + id, {
      credentials: "include",
    });
    const res = await req.json();
    return res.deliveries;
  } catch (error) {
    console.error(error);
  }
};

export const createDelivery = async (data) => {
  // console.log("Sending Data:", data);

  const request = await fetch(SERVER_URL + "/api/deliveries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });

  // console.log("Response Status:", request.status);

  if (!request.ok) {
    // console.log(request.ok);

    const errorMessage = await request.text(); // Read the error message from response
    throw new Error(
      errorMessage || "An error occurred while creating delivery"
    );
  }

  const res = await request.json();
  // console.log("Response Data:", res);
  return res;
};

export const updateDelivery = async ({ data, id }) => {
  // console.log("Update data", data.isAssigned, id);

  const req = await fetch(SERVER_URL + "/api/deliveries/" + id, {
    method: "PATCH",
    credentials: "include",

    // headers: {
    //   "Content-Type": "application/json",
    // },
    body: data,
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!req.ok) {
    throw new Error("Something went wrong while updating data");
  }
  await req.json();
  // console.log(res);

  return null;
};

export const deleteDelivery = async (id) => {
  const req = await fetch(`${SERVER_URL}/api/deliveries/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!req.ok) {
    const errorMessage = await req.text();
    throw new Error(`Failed to delete delivery: ${errorMessage}`);
  }

  return req.json(); // Return response JSON
};

export const createDriver = async (data) => {
  // console.log(data);
  const req = await fetch(SERVER_URL + "/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });
  if (!req.ok) {
    throw new Error(
      "An error occured while adding the driver, please try again!"
    );
  }
  await req.json();
  // console.log(res);

  return null;
};

export const getDeliveryById = async (id) => {
  const req = await fetch(SERVER_URL + "/api/deliveries/" + id, {
    method: "GET",
    credentials: "include",
  });

  if (!req.ok) {
    throw new Error("Error occured");
  }
  const res = await req.json();
  return res.delivery;
};

export const createCompany = async (data) => {
  const req = await fetch(SERVER_URL + "/api/companies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });

  if (!req.ok) {
    // const errorMessage = await req.text(); // Read the error message from response
    throw new Error("An error occurred while creating the company");
  }

  return req.json(); // Return response JSON
};

export const getAllCompanies = async () => {
  try {
    const req = await fetch(SERVER_URL + "/api/companies", {
      credentials: "include",
    });
    const res = await req.json();
    return res.companies;
  } catch (error) {
    console.error(error);
  }
};

export const login = async ({ email, password }) => {
  // console.log(email, password);

  try {
    const res = await fetch(SERVER_URL + "/api/auth/driver-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Ensure cookies are sent with the request
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        throw new Error("Invalid email or password");
      }
      throw new Error(`${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    // console.log(data);
    return data.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await fetch(SERVER_URL + "/api/auth/logout", {
      method: "POST",
      credentials: "include", // Ensure cookies are sent with the request
    });
  } catch (error) {
    console.log(error);
  }
};

export const checkAuth = async () => {
  // console.log("HELLO");
  try {
    const res = await fetch(SERVER_URL + "/api/auth/me-driver", {
      method: "GET",
      credentials: "include", // Send cookies with the request
    });
    if (res.ok === false) {
      throw new Error("Not authenticated");
    }
    const data = await res.json();
    const user = data.data;
    // console.log(user.role);

    if (user.role !== "driver") {
      throw new Error("Not authenticated");
    }

    return user;
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
};
