import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signUp(email, password);
      navigate("/studio");
    } catch (err) {
      setError((err as any).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-600 to-blue-700 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-wave-pattern opacity-50"></div>
      <div className="w-4/5 max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/2 p-8 relative">
          <div className="absolute top-4 left-4">
            <img src="/flipside-logo.svg" alt="Logo" className="h-10" />
          </div>
          <h1 className="text-4xl font-light mb-8 text-center mt-16">Sign Up</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900"
            >
              Sign Up
            </button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-violet-600 hover:text-violet-700"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
        <div
          className="hidden sm:block sm:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url(/default-banner.png)" }}
        ></div>
      </div>
    </div>
  );
};