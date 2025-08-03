// PasswordInput.jsx
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  autoComplete,
  visible,
  onToggle,
}) => (
  <div className="relative w-full max-w-md">
    <input
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
    />
    <div
      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-500"
      onClick={onToggle}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </div>
  </div>
);

export default PasswordInput;
