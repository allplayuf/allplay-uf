import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#121715] group-[.toaster]:text-[#F4F7F5] group-[.toaster]:border-[#223029] group-[.toaster]:shadow-[0_6px_18px_rgba(0,0,0,0.22)]",
          description: "group-[.toast]:text-[#B6C2BC]",
          actionButton:
            "group-[.toast]:bg-[#2BA84A] group-[.toast]:text-[#FFFFFF]",
          cancelButton:
            "group-[.toast]:bg-[#18221E] group-[.toast]:text-[#B6C2BC]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }