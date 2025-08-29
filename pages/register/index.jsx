import { useState } from "react";
import Link from "next/link";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.username.trim()) {
      setError("Username is required!");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://backed1.onrender.com/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      setSuccess("✅ Registration successful! You can now log in.");
      setFormData({ username: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-6 text-gray-800">
          Create Account 🚀
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="relative">
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 rounded-2xl">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-400 focus:outline-none"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-400 focus:outline-none"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label className="block text-gray-700 font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-400 focus:outline-none pr-10"
              placeholder="Enter your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="mb-4 relative">
            <label className="block text-gray-700 font-medium">Confirm Password</label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-green-400 focus:outline-none pr-10"
              placeholder="Confirm your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-green-300"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Already have an account?
          <Link href="/Login" className="text-green-500 font-medium ml-1 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
