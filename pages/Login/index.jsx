import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode"; 

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ Password toggle
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin") {
          setTimeout(() => router.push("/questions"), 100);
        } else {
          setTimeout(() => router.push("/"), 100);
        }
      } catch (error) {
        console.error("❌ Token decode qilishda xatolik:", error);
      }
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axios.post(
        "https://backed1.onrender.com/auth/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      
      localStorage.setItem("subjectId", res.data.subject_id);
      localStorage.setItem("adminId", res.data.adminId);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("role", res.data.role);

      const token = res.data.token;
      if (!token) throw new Error("Token kelmadi!");

      Cookies.set("token", token, { expires: 1 });

      const decoded = jwtDecode(token);

      if (decoded.role === "superadmin") {
        router.push("/adminlar");
      } else if (decoded.role === "admin") {
        router.push("/questions");
      } else {
        router.push("/quiz");
      }
    } catch (err) {
      console.error("❌ Login error:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-6 text-gray-800">
          Welcome Back 👋
        </h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 rounded-2xl">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label className="block text-gray-700 font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"} // 👁️ toggle
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Don’t have an account?
          <Link href="/register" className="text-blue-500 ml-1 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
