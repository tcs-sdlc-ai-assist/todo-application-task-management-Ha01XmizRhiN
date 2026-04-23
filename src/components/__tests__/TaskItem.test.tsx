import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskItem } from "@/components/TaskItem";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  userId: "user-1",
  title: "Test Task",
  description: "This is a test task description",
  status: TaskStatus.TODO,
  createdAt: "2024-01-15T00:00:00.000Z",
  dueDate: null,
  ...overrides,
});

describe("TaskItem", () => {
  let onToggleComplete: ReturnType<typeof vi.fn>;
  let onEdit: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onToggleComplete = vi.fn();
    onEdit = vi.fn();
    onDelete = vi.fn();
  });

  const renderTaskItem = (task: Task) =>
    render(
      <ul>
        <TaskItem
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </ul>
    );

  describe("rendering", () => {
    it("renders the task title", () => {
      const task = createTask({ title: "My Important Task" });
      renderTaskItem(task);

      expect(screen.getByText("My Important Task")).toBeInTheDocument();
    });

    it("renders the task description", () => {
      const task = createTask({ description: "Some description text" });
      renderTaskItem(task);

      expect(screen.getByText("Some description text")).toBeInTheDocument();
    });

    it("renders the status badge for TODO", () => {
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      expect(screen.getByText("To Do")).toBeInTheDocument();
    });

    it("renders the status badge for IN_PROGRESS", () => {
      const task = createTask({ status: TaskStatus.IN_PROGRESS });
      renderTaskItem(task);

      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("renders the status badge for DONE", () => {
      const task = createTask({ status: TaskStatus.DONE });
      renderTaskItem(task);

      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("renders the due date when provided", () => {
      const task = createTask({ dueDate: "2024-12-31T00:00:00.000Z" });
      renderTaskItem(task);

      expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
    });

    it("does not render a due date when null", () => {
      const task = createTask({ dueDate: null });
      renderTaskItem(task);

      expect(screen.queryByText("📅")).not.toBeInTheDocument();
    });

    it("renders overdue indicator for past due dates on non-done tasks", () => {
      const task = createTask({
        status: TaskStatus.TODO,
        dueDate: "2020-01-01T00:00:00.000Z",
      });
      renderTaskItem(task);

      expect(screen.getByText("(Overdue)")).toBeInTheDocument();
    });

    it("does not render overdue indicator for done tasks with past due dates", () => {
      const task = createTask({
        status: TaskStatus.DONE,
        dueDate: "2020-01-01T00:00:00.000Z",
      });
      renderTaskItem(task);

      expect(screen.queryByText("(Overdue)")).not.toBeInTheDocument();
    });

    it("applies line-through styling to done task titles", () => {
      const task = createTask({ status: TaskStatus.DONE });
      renderTaskItem(task);

      const title = screen.getByText(task.title);
      expect(title).toHaveClass("line-through");
    });

    it("does not apply line-through styling to non-done task titles", () => {
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      const title = screen.getByText(task.title);
      expect(title).not.toHaveClass("line-through");
    });

    it("truncates long descriptions", () => {
      const longDescription = "A".repeat(200);
      const task = createTask({ description: longDescription });
      renderTaskItem(task);

      expect(screen.queryByText(longDescription)).not.toBeInTheDocument();
      expect(screen.getByText(/A+…$/)).toBeInTheDocument();
    });

    it("does not render description when empty", () => {
      const task = createTask({ description: "" });
      renderTaskItem(task);

      const listItem = screen.getByRole("listitem");
      const paragraphs = listItem.querySelectorAll("p");
      const descriptionParagraphs = Array.from(paragraphs).filter(
        (p) => !p.textContent?.includes("📅")
      );
      expect(descriptionParagraphs).toHaveLength(0);
    });
  });

  describe("accessibility", () => {
    it("has an aria-label on the list item", () => {
      const task = createTask({ title: "Accessible Task" });
      renderTaskItem(task);

      expect(
        screen.getByRole("listitem", { name: /Task: Accessible Task/ })
      ).toBeInTheDocument();
    });

    it("renders a checkbox role for the completion toggle", () => {
      const task = createTask();
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("sets aria-checked to false for non-done tasks", () => {
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    it("sets aria-checked to true for done tasks", () => {
      const task = createTask({ status: TaskStatus.DONE });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });

    it("has an aria-label on the checkbox describing the toggle action", () => {
      const task = createTask({ title: "My Task", status: TaskStatus.TODO });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute(
        "aria-label",
        'Mark "My Task" as complete'
      );
    });

    it("has an aria-label on the edit button", () => {
      const task = createTask({ title: "Editable Task" });
      renderTaskItem(task);

      expect(
        screen.getByRole("button", { name: 'Edit task "Editable Task"' })
      ).toBeInTheDocument();
    });

    it("has an aria-label on the delete button", () => {
      const task = createTask({ title: "Deletable Task" });
      renderTaskItem(task);

      expect(
        screen.getByRole("button", { name: 'Delete task "Deletable Task"' })
      ).toBeInTheDocument();
    });

    it("has a status aria-label on the badge", () => {
      const task = createTask({ status: TaskStatus.IN_PROGRESS });
      renderTaskItem(task);

      expect(
        screen.getByLabelText("Status: In Progress")
      ).toBeInTheDocument();
    });

    it("checkbox is focusable via tabIndex", () => {
      const task = createTask();
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("tabindex", "0");
    });

    it("toggles completion when Enter key is pressed on checkbox", async () => {
      const user = userEvent.setup();
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      await user.keyboard("{Enter}");

      expect(onToggleComplete).toHaveBeenCalledWith("task-1", TaskStatus.DONE);
    });

    it("toggles completion when Space key is pressed on checkbox", async () => {
      const user = userEvent.setup();
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      await user.keyboard(" ");

      expect(onToggleComplete).toHaveBeenCalledWith("task-1", TaskStatus.DONE);
    });
  });

  describe("interactions", () => {
    it("calls onToggleComplete with DONE when clicking a TODO task checkbox", async () => {
      const user = userEvent.setup();
      const task = createTask({ status: TaskStatus.TODO });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(onToggleComplete).toHaveBeenCalledTimes(1);
      expect(onToggleComplete).toHaveBeenCalledWith("task-1", TaskStatus.DONE);
    });

    it("calls onToggleComplete with TODO when clicking a DONE task checkbox", async () => {
      const user = userEvent.setup();
      const task = createTask({ status: TaskStatus.DONE });
      renderTaskItem(task);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(onToggleComplete).toHaveBeenCalledTimes(1);
      expect(onToggleComplete).toHaveBeenCalledWith("task-1", TaskStatus.TODO);
    });

    it("calls onEdit with the task when clicking the edit button", async () => {
      const user = userEvent.setup();
      const task = createTask({ title: "Edit Me" });
      renderTaskItem(task);

      const editButton = screen.getByRole("button", {
        name: 'Edit task "Edit Me"',
      });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(task);
    });

    it("shows delete confirmation when clicking the delete button", async () => {
      const user = userEvent.setup();
      const task = createTask({ title: "Delete Me" });
      renderTaskItem(task);

      const deleteButton = screen.getByRole("button", {
        name: 'Delete task "Delete Me"',
      });
      await user.click(deleteButton);

      expect(screen.getByText("Delete?")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Confirm delete" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel delete" })
      ).toBeInTheDocument();
    });

    it("calls onDelete when confirming deletion", async () => {
      const user = userEvent.setup();
      const task = createTask();
      renderTaskItem(task);

      const deleteButton = screen.getByRole("button", {
        name: `Delete task "${task.title}"`,
      });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole("button", {
        name: "Confirm delete",
      });
      await user.click(confirmButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("task-1");
    });

    it("hides delete confirmation when cancelling deletion", async () => {
      const user = userEvent.setup();
      const task = createTask();
      renderTaskItem(task);

      const deleteButton = screen.getByRole("button", {
        name: `Delete task "${task.title}"`,
      });
      await user.click(deleteButton);

      expect(screen.getByText("Delete?")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", {
        name: "Cancel delete",
      });
      await user.click(cancelButton);

      expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("does not call onDelete when cancelling", async () => {
      const user = userEvent.setup();
      const task = createTask();
      renderTaskItem(task);

      const deleteButton = screen.getByRole("button", {
        name: `Delete task "${task.title}"`,
      });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole("button", {
        name: "Cancel delete",
      });
      await user.click(cancelButton);

      expect(onDelete).not.toHaveBeenCalled();
    });

    it("shows the delete confirmation as an alertdialog", async () => {
      const user = userEvent.setup();
      const task = createTask();
      renderTaskItem(task);

      const deleteButton = screen.getByRole("button", {
        name: `Delete task "${task.title}"`,
      });
      await user.click(deleteButton);

      expect(
        screen.getByRole("alertdialog", { name: "Confirm deletion" })
      ).toBeInTheDocument();
    });
  });
});