import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password required"),
});

export default function Login() {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) navigate("/dashboard");
  };

  return (
    <div className="flex-center min-h-screen bg-gray-50 px-4">
      <div className="card card-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              {...register("email")}
              type="email"
              className="form-input"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              {...register("password")}
              type="password"
              className="form-input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block py-3"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <span className="spinner mr-3"></span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
