"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
  type CategoryFormState,
} from "@/actions/admin";
import { useToast } from "@/components/ToastProvider";

interface Category {
  id: string;
  name: string;
}

function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const { showToast } = useToast();

  function saveRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      setName(category.name);
      return;
    }
    startTransition(async () => {
      await renameCategoryAction(category.id, trimmed);
      showToast("Category renamed", "success");
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${category.name}"? Existing shops keep this category listed, but it will no longer be selectable.`)) {
      return;
    }
    startTransition(async () => {
      await deleteCategoryAction(category.id);
      showToast("Category deleted", "success");
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveRename}
          onKeyDown={(e) => e.key === "Enter" && saveRename()}
          autoFocus
          className="field flex-1"
        />
      ) : (
        <span className="flex-1">{category.name}</span>
      )}
      <div className="flex gap-2">
        <button disabled={isPending} onClick={() => setEditing((v) => !v)} className="btn-ghost px-2 py-1 text-xs">
          {editing ? "Cancel" : "Rename"}
        </button>
        <button disabled={isPending} onClick={handleDelete} className="btn-ghost px-2 py-1 text-xs text-red-600">
          Delete
        </button>
      </div>
    </li>
  );
}

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState<CategoryFormState, FormData>(createCategoryAction, {});
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      showToast("Category added", "success");
      formRef.current?.reset(); // DOM reset, not React state — safe to call here
    }
    if (state.error) showToast(state.error, "error");
    // Only fire when a new result comes back from the server action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Add category</h2>
        <form ref={formRef} action={formAction} className="flex gap-2">
          <input name="name" placeholder="e.g. Drone" required className="field" />
          <button type="submit" disabled={isPending} className="btn-primary shrink-0">
            {isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">All categories ({categories.length})</h2>
        <ul>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}
