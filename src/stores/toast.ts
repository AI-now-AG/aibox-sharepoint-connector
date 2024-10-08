import { writable } from "svelte/store";

type ToastOptions = {
  id?: number;
  message: string;
  type?: string;
  dismissible?: boolean;
  timeout?: number;
};

export const toasts = writable<ToastOptions[]>([]);

export const addToast = (toast: ToastOptions) => {
  // Create a unique ID so we can easily find/remove it
  // if it is dismissible/has a timeout.
  const id = Math.floor(Math.random() * 10000);

  // Setup some sensible defaults for a toast.
  const defaults: Partial<ToastOptions> = {
    id,
    type: "info",
    dismissible: true,
    timeout: 3000,
  };

  // Push the toast to the top of the list of toasts
  toasts.update((all: ToastOptions[]) => {
    return [{ ...defaults, ...toast }, ...all];
  });

  // If toast is dismissible, dismiss it after "timeout" amount of time.
  const timeout = toast?.timeout || defaults?.timeout;
  if (timeout) {
    setTimeout(() => dismissToast(id), timeout);
  }
};

export const dismissToast = (id: number) => {
  toasts.update((all: ToastOptions[]) => {
    return all.filter((t: ToastOptions) => t.id !== id);
  });
};
