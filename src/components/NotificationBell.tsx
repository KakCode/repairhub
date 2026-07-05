"use client";

import { useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/actions/booking";

interface NotificationItem {
  id: string;
  message: string;
  createdAt: Date;
}

export default function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-medium text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 z-20 mt-2 w-72 p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-zinc-500">No new notifications</p>
          ) : (
            <>
              <ul className="max-h-64 divide-y divide-[var(--border)] overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="p-2.5 text-sm">
                    {n.message}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await markNotificationsReadAction();
                    setOpen(false);
                  })
                }
                className="btn-ghost mt-1 w-full"
              >
                Mark all as read
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
