import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/Auth.css";

const getSchema = (role) =>
  yup.object({
    name: yup.string().trim().required("Full name is required"),
    email: yup
      .string()
      .email("Please enter a valid email")
      .required("Email is required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
    role: yup
      .string()
      .oneOf(["seeker", "company", "university"])
      .required("Please select a role"),
    phone_number: yup.string().nullable(),
    ...(role === "company" && {
      address: yup.string().trim().required("Company address is required"),
      certificate: yup
        .mixed()
        .test("required", "Certificate is required", (value) => {
          return value && value.length > 0;
        })
        .test("fileSize", "File size must be less than 5MB", (value) => {
          return value && value[0] && value[0].size <= 5242880;
        })
        .test(
          "fileType",
          "Only PDF, JPG, JPEG, and PNG files are allowed",
          (value) => {
            return (
              value &&
              value[0] &&
              [
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
              ].includes(value[0].type)
            );
          },
        ),
    }),
  });

export default function Register() {
  const [role, setRole] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const {
    register: signup,
    isLoading,
    error,
    validationErrors,
  } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(getSchema(role)),
  });

  const onSubmit = async (data) => {
    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      // Skip address and certificate if not a company
      if (
        (key === "address" || key === "certificate") &&
        data.role !== "company"
      ) {
        return;
      }

      if (key === "certificate" && data[key]?.length > 0) {
        formData.append(key, data[key][0]);
      } else if (key !== "certificate") {
        formData.append(key, data[key] || "");
      }
    });

    const result = await signup(formData);
    if (result.success) {
      if (data.role === "company") {
        alert(
          "Registration successful! Your account is pending admin verification.",
        );
        navigate("/company/profile");
      } else if (data.role === "university") {
        navigate("/university/profile");
      } else {
        navigate("/profile");
      }
    }
  };

  const showError = (field) => {
    if (validationErrors?.[field]) {
      return <p className="form-error">{validationErrors[field][0]}</p>;
    }
    if (errors[field]) {
      return <p className="form-error">{errors[field].message}</p>;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setCertificateFile(null);
    // Clear address and certificate fields when changing role
    if (newRole !== "company") {
      reset(
        { address: "", certificate: null },
        { keepValues: true, keepErrors: false },
      );
    }
  };

  return (
    <div className="flex-center min-h-screen bg-slate-100 px-4 py-8">
      <div className="card card-lg w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-slate-600">Join our internship platform</p>
        </div>

        {error && <div className="alert alert-error mb-6">{error}</div>}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          encType="multipart/form-data"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">
                {role === "seeker"
                  ? "Full Name"
                  : role === "company"
                    ? "Company Name"
                    : role === "university"
                      ? "University Name"
                      : "Full Name"}{" "}
                *
              </label>
              <input
                {...register("name")}
                className="form-input"
                placeholder={
                  role === "seeker"
                    ? "John Doe"
                    : role === "company"
                      ? "Tech Corp Inc."
                      : role === "university"
                        ? "Al Maaref University"
                        : "Enter name"
                }
              />
              {showError("name")}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                {...register("email")}
                type="email"
                className="form-input"
                placeholder="you@example.com"
              />
              {showError("email")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                {...register("password")}
                type="password"
                className="form-input"
                placeholder="••••••••"
              />
              {showError("password")}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                {...register("password_confirmation")}
                type="password"
                className="form-input"
                placeholder="••••••••"
              />
              {showError("password_confirmation")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input
                {...register("phone_number")}
                className="form-input"
                placeholder="+1234567890"
              />
              {showError("phone_number")}
            </div>

            <div className="form-group">
              <label className="form-label">I am a: *</label>
              <select
                {...register("role")}
                onChange={handleRoleChange}
                className="form-select"
              >
                <option value="">Select your role</option>
                <option value="seeker">Internship Seeker</option>
                <option value="company">Company</option>
                <option value="university">University</option>
              </select>
              {showError("role")}
            </div>
          </div>

          {role === "company" && (
            <div className="space-y-5 pt-4 border-t border-slate-200">
              <div className="form-group">
                <label className="form-label">Company Address *</label>
                <input
                  {...register("address")}
                  className="form-input"
                  placeholder="123 Business Street, City, Country"
                />
                {showError("address")}
              </div>

              <div className="form-group">
                <label className="form-label">Business Certificate *</label>
                <p className="text-sm text-slate-500 mb-2">
                  Upload your business registration certificate or proof of
                  authenticity (PDF, JPG, PNG - Max 5MB)
                </p>
                <input
                  {...register("certificate")}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="form-input"
                />
                {certificateFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Selected: {certificateFile.name}
                  </p>
                )}
                {showError("certificate")}
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Your account will be pending admin verification until your
                  certificate is reviewed.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block mt-6 py-3"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <span className="spinner mr-3"></span>
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-center text-slate-600 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
