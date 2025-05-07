# 🚚 Delivery App Dashboard

This project is a web-based delivery management system featuring two separate portals:
- **Admin Dashboard**: For managing deliveries, drivers, and orders.
- **Driver Dashboard**: For drivers to view and update delivery status.

---

## 🔗 Live Links

- **Admin Dashboard**: [View Admin Panel](https://taupe-dasik-3af313.netlify.app/)  
  - **Email**: `admin@gmail.com`  
  - **Password**: `sysadmin648`

- **Driver Dashboard**: [View Driver Panel](https://genuine-kulfi-abb366.netlify.app/)  
  - **Email**: mnm@gmail.com`  
  - **Password**: `mnm123`

---

## 🛠️ Tech Stack

- Frontend: React (or your framework)
- Backend: Node.js / Typescript / Firebase /
- Database: Firestore

---

## 🚀 Features

### 🛠 Admin Portal

The Admin Dashboard provides full control over the operational side of the delivery system. With this interface, an admin can:

- **Company Management**:  
  - Create new companies to organize and group drivers and deliveries  
  - Edit company details or remove them as needed  

- **Driver Management**:  
  - Add new drivers to the system  
  - Update driver details (e.g., name, contact, assigned company)  
  - Remove drivers when no longer needed  

- **Order Management**:  
  - Create new delivery orders and assign them to companies or leave them unassigned for drivers to pick  
  - Modify order details including delivery address, recipient info, and status  
  - Delete orders that are no longer valid  

- **Delivery Tracking**:  
  - View the current status of each delivery in real-time  
  - Monitor which drivers have accepted and delivered which orders  

This portal is designed to simplify day-to-day logistics and maintain operational transparency.

---

### 🚗 Driver Portal

The Driver Dashboard is tailored for ease of use, helping drivers manage their delivery workflow. Key capabilities include:

- **Order Browsing**:  
  - View a list of all available (unassigned) delivery orders  
  - Select any order to accept and begin the delivery process  

- **Delivery Updates**:  
  - Mark deliveries as "In Progress" or "Delivered" to update the system in real-time  
  - Stay informed with a clear list of current and past deliveries  

This portal empowers drivers with the flexibility to choose their deliveries and ensures smooth communication with the system.

---

## 🧪 Testing Credentials

Use the above credentials to log in and test both dashboards.

---

## 📂 Project Structure

```bash
/root
  └── /admin       # Admin dashboard code
  └── /driver      # Driver dashboard code
