// import { useMutation } from "@tanstack/react-query";
// import { useState } from "react";
// import { resetAdminPassword } from "../http/http";

// const Settings = () => {
//   const [newPassword, setNewPassword] = useState("");
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");

//   const { mutateAsync: resetPasswordMutate, isPending: resettingPassword } =
//     useMutation({
//       mutationFn: resetAdminPassword,
//       onSuccess: () => {
//         alert("Password reset successfully!");
//         // setShowResetModal(false);
//         setNewPassword("");
//         setConfirmPassword("");
//         setCurrentPassword("");
//       },
//       onError: (error) => {
//         alert(error);
//       },
//     });

//   // Handlers
//   const handlePasswordChange = (e) => {
//     setNewPassword(e.target.value);
//     setError("");
//   };

//   const handleConfirmChange = (e) => {
//     setConfirmPassword(e.target.value);
//     setError("");
//   };

//   const handleCurrentChange = (e) => {
//     setCurrentPassword(e.target.value);
//     setError("");
//   };

//   const handleResetSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     if (newPassword !== confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }
//     if (newPassword.length < 6) {
//       setError("Password must be at least 6 characters long");
//       return;
//     }
//     await resetPasswordMutate({
//       currentPassword,
//       newPassword,
//       confirmPassword,
//     });
//     // Proceed with password reset logic
//     console.log("Password reset successful:", newPassword);
//   };
//   return (
//     <>
//       <div className=" text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
//         Settings
//       </div>
//       {/* Close Button */}
//       <div className=" ">
//         <h2 className="text-xl font-bold px-6 pt-6">Reset Password</h2>
//         <form className=" px-6 pt-6 font-outfit flex flex-col items-start space-y-4">
//           <input
//             type="password"
//             placeholder="Current Password"
//             autoComplete="current-password"
//             value={currentPassword}
//             onChange={handleCurrentChange}
//             className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
//           />
//           <input
//             type="password"
//             placeholder="New Password"
//             value={newPassword}
//             autoComplete="new-password"
//             onChange={handlePasswordChange}
//             className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
//           />
//           <input
//             type="password"
//             placeholder="Confirm Password"
//             value={confirmPassword}
//             autoComplete="new-password"
//             onChange={handleConfirmChange}
//             className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
//           />

//           <button
//             onClick={handleResetSubmit}
//             disabled={resettingPassword}
//             className="mt-2 px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
//           >
//             {resettingPassword ? "Resetting..." : "Submit"}
//           </button>
//         </form>
//         {error && <div className="mt-2 text-red-600 font-medium">{error}</div>}
//       </div>
//     </>
//   );
// };

// export default Settings;

// Settings.jsx
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { resetAdminPassword } from "../http/http";
import PasswordInput from "./../components/PasswordInput"; // update path as needed

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { mutateAsync: resetPasswordMutate, isPending: resettingPassword } =
    useMutation({
      mutationFn: resetAdminPassword,
      onSuccess: () => {
        alert("Password reset successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      },
      onError: (error) => {
        alert(error);
      },
    });

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    await resetPasswordMutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third font-outfit">
        Settings
      </div>
      <div>
        <h2 className="text-xl font-bold px-6 pt-6">Reset Password</h2>
        <form className="px-6 pt-6 font-outfit flex flex-col items-start space-y-4">
          <PasswordInput
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError("");
            }}
            placeholder="Current Password"
            autoComplete="current-password"
            visible={show.current}
            onToggle={() =>
              setShow((prev) => ({ ...prev, current: !prev.current }))
            }
          />
          <PasswordInput
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            placeholder="New Password"
            autoComplete="new-password"
            visible={show.new}
            onToggle={() => setShow((prev) => ({ ...prev, new: !prev.new }))}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            placeholder="Confirm Password"
            autoComplete="new-password"
            visible={show.confirm}
            onToggle={() =>
              setShow((prev) => ({ ...prev, confirm: !prev.confirm }))
            }
          />

          <button
            onClick={handleResetSubmit}
            disabled={resettingPassword}
            className="mt-2 px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            {resettingPassword ? "Resetting..." : "Submit"}
          </button>
        </form>
        {error && <div className="mt-2 text-red-600 font-medium">{error}</div>}
      </div>
    </>
  );
};

export default Settings;
