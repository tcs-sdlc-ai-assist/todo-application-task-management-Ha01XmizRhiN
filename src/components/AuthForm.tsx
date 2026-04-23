"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MIN_PASSWORD_LENGTH } from "@/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type AuthMode = "login" | "register";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(
  email: string,
  password: string,
  confirmPassword: string,
  mode: AuthMode
): FormErrors {
  const errors: FormErrors = {};

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Email format is invalid";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (mode === "register") {
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
}

export const AuthForm: React.FC = () => {
  const { login, register, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isLoading = isSubmitting || authLoading;

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setErrors({});
    setConfirmPassword("");
  }, []);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (errors.email) {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    },
    [errors.email]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (errors.password) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      }
    },
    [errors.password]
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
      if (errors.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    },
    [errors.confirmPassword]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearErrors();

      const formErrors = validateForm(email, password, confirmPassword, mode);

      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        if (mode === "login") {
          await login({ email: email.trim(), password });
        } else {
          await register({ email: email.trim(), password });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        setErrors({ general: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, confirmPassword, mode, login, register, clearErrors]
  );

  const isLoginMode = mode === "login";
  const headingText = isLoginMode ? "Sign In" : "Create Account";
  const submitText = isLoginMode ? "Sign In" : "Create Account";
  const toggleText = isLoginMode
    ? "Don't have an account?"
    : "Already have an account?";
  const toggleActionText = isLoginMode ? "Register" : "Sign In";

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2
        id="auth-form-heading"
        className="text-center text-2xl font-semibold text-gray-900"
      >
        {headingText}
      </h2>

      {errors.general && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-labelledby="auth-form-heading"
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="auth-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete={isLoginMode ? "email" : "email"}
            required
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
              errors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p
              id="auth-email-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isLoginMode ? "current-password" : "new-password"}
            required
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={
              errors.password ? "auth-password-error" : "auth-password-hint"
            }
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
              errors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder="••••••••"
          />
          {errors.password ? (
            <p
              id="auth-password-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.password}
            </p>
          ) : (
            <p
              id="auth-password-hint"
              className="mt-1 text-xs text-gray-500"
            >
              Minimum {MIN_PASSWORD_LENGTH} characters
            </p>
          )}
        </div>

        {!isLoginMode && (
          <div>
            <label
              htmlFor="auth-confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="auth-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={
                errors.confirmPassword
                  ? "auth-confirm-password-error"
                  : undefined
              }
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p
                id="auth-confirm-password-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span>{isLoginMode ? "Signing in…" : "Creating account…"}</span>
            </>
          ) : (
            submitText
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <span>{toggleText} </span>
        <button
          type="button"
          onClick={toggleMode}
          disabled={isLoading}
          className="font-medium text-blue-600 underline-offset-2 transition-colors hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Switch to ${toggleActionText.toLowerCase()} form`}
        >
          {toggleActionText}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;