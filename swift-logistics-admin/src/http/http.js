// export const SERVER_URL = "http://localhost:3000";
export const SERVER_URL = "https://delivery-tracker-server.onrender.com";
// export const SERVER_URL = "http://34.121.241.109:3000";

export const getAllDeliveries = async () => {
  try {
    const req = await fetch(SERVER_URL + "/api/deliveries", {
      credentials: "include",
    });
    const res = await req.json();
    return res;
  } catch (error) {
    console.error(error);
  }
};

export const getDeliveriesPage = async (
  cursor = null,
  searchTerm = "",
  deliveryStatus = ""
) => {
  // console.log("Fetching deliveries with cursor:", cursor);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    if (searchTerm) params.append("orderSerial", searchTerm);
    if (deliveryStatus) params.append("deliveryStatus", deliveryStatus);
    // console.log(SERVER_URL + `/api/deliveries?${params.toString()}`);
    const response = await fetch(
      SERVER_URL + `/api/deliveries?${params.toString()}`
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
  // console.log("Update data", data);

  const req = await fetch(SERVER_URL + "/api/deliveries/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });
  if (!req.ok) {
    throw new Error("Something went wrong while updating data");
  }
  await req.json();
  // console.log(res);

  return null;
};

export const updateDriver = async ({ data, id }) => {
  const req = await fetch(SERVER_URL + "/api/users/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });
  if (!req.ok) {
    throw new Error("Something went wrong while updating data");
  }
  await req.json();

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
  const req = await fetch(SERVER_URL + "/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });

  const res = await req.json();
  // console.log(res);
  if (!res.success || !req.ok) {
    throw new Error(res.message);
  }
  return null;
};

export const deleteDriver = async (id) => {
  const req = await fetch(SERVER_URL + "/api/users/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!req.ok) {
    throw new Error("Something went wrong while deleting driver");
  }
  await req.json();
  // console.log(res);

  return null;
};

export const getAllDrivers = async () => {
  try {
    const req = await fetch(SERVER_URL + "/api/users", {
      credentials: "include",
    });
    const res = await req.json();
    return res.users;
  } catch (error) {
    console.error(error);
  }
};

export const getDriverById = async (id) => {
  const req = await fetch(SERVER_URL + "/api/users/" + id);
  if (!req.ok) {
    throw new Error("Error occured");
  }
  const res = await req.json();
  return res.user;
};

export const getDeliveryById = async (id) => {
  const req = await fetch(SERVER_URL + "/api/deliveries/" + id, {
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

export const getCompanyById = async (id) => {
  const req = await fetch(SERVER_URL + "/api/companies/" + id, {
    credentials: "include",
  });
  if (!req.ok) {
    throw new Error("Error occured");
  }
  const res = await req.json();
  return res.company;
};

export const updateCompany = async ({ data, id }) => {
  // console.log("Update data id", id);
  // console.log("Update data", data);

  const req = await fetch(SERVER_URL + "/api/companies/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify(data),
  });
  if (!req.ok) {
    throw new Error("Something went wrong while updating data");
  }
  await req.json();
  // console.log(res);

  return null;
};

export const deleteCompany = async (id) => {
  const req = await fetch(`${SERVER_URL}/api/companies/${id}`, {
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

export const login = async ({ email, password }) => {
  // console.log(email, password);

  try {
    const res = await fetch(SERVER_URL + "/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      // console.log(data.message);
      if (data?.message) {
        throw new Error(`${data.message} - ${res.statusText}`);
      } else {
        throw new Error(`Something went wrong, please try again`);
      }
    }

    const data = await res.json();
    // console.log(data);
    return data.token;
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
  try {
    const res = await fetch(SERVER_URL + "/api/auth/me-admin", {
      method: "GET",
      credentials: "include", // Send cookies with the request
    });
    // console.log(res);

    if (res.ok === false) {
      throw new Error("Not authenticated");
    }

    const data = await res.json();
    const user = data.user;

    if (user.role !== "admin") {
      throw new Error("Not authenticated");
    }

    return user;
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
};
