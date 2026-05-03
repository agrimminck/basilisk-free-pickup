import { Navbar } from "@/components/navbar";
import { MOCK_USER_FLETERO } from "@/lib/data";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        userRole={MOCK_USER_FLETERO.role}
        userName={MOCK_USER_FLETERO.name}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
