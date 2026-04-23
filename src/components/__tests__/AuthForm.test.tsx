import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "@/components/AuthForm";
import { MIN_PASSWORD_LENGTH } from "@/constants";

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isLoading: false,
    user: null,
    token: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login mode rendering", () => {
    it("renders the sign in heading by default", () => {
      render(<AuthForm />);

      expect(
        screen.getByRole("heading", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("renders email and password fields", () => {
      render(<AuthForm />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders the sign in submit button", () => {
      render(<AuthForm />);

      expect(
        screen.getByRole("button", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("does not render the confirm password field in login mode", () => {
      render(<AuthForm />);

      expect(screen.queryByLabelText("Confirm Password")).not.toBeInTheDocument();
    });

    it("renders a link to switch to register mode", () => {
      render(<AuthForm />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /switch to register form/i })
      ).toBeInTheDocument();
    });
  });

  describe("register mode rendering", () => {
    it("renders the create account heading after toggling", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButton = screen.getByRole("button", {
        name: /switch to register form/i,
      });
      await user.click(toggleButton);

      expect(
        screen.getByRole("heading", { name: "Create Account" })
      ).toBeInTheDocument();
    });

    it("renders the confirm password field in register mode", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButton = screen.getByRole("button", {
        name: /switch to register form/i,
      });
      await user.click(toggleButton);

      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("renders the create account submit button", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButton = screen.getByRole("button", {
        name: /switch to register form/i,
      });
      await user.click(toggleButton);

      expect(
        screen.getByRole("button", { name: "Create Account" })
      ).toBeInTheDocument();
    });

    it("renders a link to switch back to login mode", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButton = screen.getByRole("button", {
        name: /switch to register form/i,
      });
      await user.click(toggleButton);

      expect(screen.getByText("Already have an account?")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /switch to sign in form/i })
      ).toBeInTheDocument();
    });
  });

  describe("mode toggling", () => {
    it("toggles from login to register and back", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      expect(
        screen.getByRole("heading", { name: "Sign In" })
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      expect(
        screen.getByRole("heading", { name: "Create Account" })
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /switch to sign in form/i })
      );

      expect(
        screen.getByRole("heading", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("clears errors when toggling modes", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(screen.getByText("Email is required")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
    });
  });

  describe("login form validation", () => {
    it("shows email required error when email is empty", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("shows password required error when password is empty", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });

    it("shows invalid email error for malformed email", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "not-an-email");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(screen.getByText("Email format is invalid")).toBeInTheDocument();
    });

    it("shows password length error for short password", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(
        screen.getByText(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        )
      ).toBeInTheDocument();
    });

    it("does not call login when validation fails", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("register form validation", () => {
    it("shows confirm password required error when empty", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Please confirm your password")
      ).toBeInTheDocument();
    });

    it("shows passwords do not match error", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      await user.click(submitButton);

      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    it("does not call register when validation fails", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      await user.click(submitButton);

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe("form submission", () => {
    it("calls login with trimmed email and password on valid login submission", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "  test@example.com  ");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("calls register with trimmed email and password on valid register submission", async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
        expect(mockRegister).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });
  });

  describe("error display", () => {
    it("displays a general error when login fails", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("displays a general error when register fails", async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce(
        new Error("Email already registered")
      );
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Email already registered")
        ).toBeInTheDocument();
      });
    });

    it("displays a fallback error message for non-Error exceptions", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce("something unexpected");
      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("An unexpected error occurred")
        ).toBeInTheDocument();
      });
    });

    it("clears field errors when the user types in the field", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      expect(screen.getByText("Email is required")).toBeInTheDocument();

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "t");

      expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has a form with an accessible label", () => {
      render(<AuthForm />);

      const form = screen.getByRole("form", { name: "" });
      expect(form).toHaveAttribute("aria-labelledby", "auth-form-heading");
    });

    it("has proper labels for all input fields", () => {
      render(<AuthForm />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("has proper labels for confirm password in register mode", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      await user.click(
        screen.getByRole("button", { name: /switch to register form/i })
      );

      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("sets aria-invalid on email field when there is an error", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-invalid on password field when there is an error", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-describedby on email field pointing to error message", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("aria-describedby", "auth-email-error");

      const errorElement = document.getElementById("auth-email-error");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent("Email is required");
    });

    it("sets aria-describedby on password field pointing to error message", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute(
        "aria-describedby",
        "auth-password-error"
      );

      const errorElement = document.getElementById("auth-password-error");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent("Password is required");
    });

    it("displays password hint when there is no error", () => {
      render(<AuthForm />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute(
        "aria-describedby",
        "auth-password-hint"
      );

      const hintElement = document.getElementById("auth-password-hint");
      expect(hintElement).toBeInTheDocument();
      expect(hintElement).toHaveTextContent(
        `Minimum ${MIN_PASSWORD_LENGTH} characters`
      );
    });

    it("general error has role alert and aria-live assertive", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Login failed"));
      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Login failed");
        expect(alert).toHaveAttribute("aria-live", "assertive");
      });
    });

    it("field error messages have role alert", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it("submit button has aria-busy when submitting", async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValueOnce(loginPromise);

      render(<AuthForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /signing in/i })
        ).toHaveAttribute("aria-busy", "true");
      });

      resolveLogin!();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Sign In" })
        ).toHaveAttribute("aria-busy", "false");
      });
    });

    it("toggle button has descriptive aria-label", () => {
      render(<AuthForm />);

      const toggleButton = screen.getByRole("button", {
        name: /switch to register form/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });
  });
});