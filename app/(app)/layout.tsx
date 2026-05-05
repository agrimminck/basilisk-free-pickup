import { NavbarWrapper } from "@/components/navbar-wrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarWrapper />
      <main className="flex-1">{children}</main>
    </div>
  );
}
