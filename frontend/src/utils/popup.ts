import Swal, { type SweetAlertOptions } from "sweetalert2";

export const Toast = (options?: SweetAlertOptions) =>
  Swal.mixin({
    ...options,
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  }).fire();

export const ConfirmToast = (options?: SweetAlertOptions) =>
  Swal.mixin({
    ...options,
    toast: true,
    position: "bottom-end",
    showConfirmButton: true,
    confirmButtonColor: "var(--sl-color-accent)",
    showDenyButton: true,
    denyButtonColor: "gray",
    timerProgressBar: false,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  }).fire();

export function log(message: unknown) {
  console.log(message);
  const text = JSON.stringify(message, null, "\t");
  Toast({html: `<div style="white-space:pre-wrap">${text}</div>`, grow: "column", showCloseButton: true});
}