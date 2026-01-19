import toast from "react-hot-toast";

const toastOptions = {
  duration: 2500,
  position: "top-right" as const,
  style: {
    background: "#333",
    color: "#fff",
    borderRadius: "8px",
    padding: "12px 20px",
  },
};

export const successToast = (message: string): void => {
  toast.success(message, {
    ...toastOptions,
    iconTheme: {
      primary: "#10b981",
      secondary: "#fff",
    },
  });
};

export const errorToast = (message: string): void => {
  toast.error(message, {
    ...toastOptions,
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
  });
};

export const infoToast = (message: string): void => {
  toast(message, {
    ...toastOptions,
    icon: "ℹ️",
  });
};

export const warningToast = (message: string): void => {
  toast(message, {
    ...toastOptions,
    icon: "⚠️",
    style: {
      ...toastOptions.style,
      background: "#f59e0b",
    },
  });
};

export default toast;
