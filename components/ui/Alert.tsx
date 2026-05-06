type Variant = "error" | "success" | "info" | "warning";

const styles: Record<Variant, string> = {
  error: "bg-danger/10 text-danger border-danger/30",
  success: "bg-success/10 text-success border-success/30",
  info: "bg-brand/10 text-brand border-brand/30",
  warning: "bg-warning/10 text-warning border-warning/30",
};

export function Alert({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <div className={`text-sm rounded-xl border px-3.5 py-3 ${styles[variant]}`} role="alert">
      {children}
    </div>
  );
}
