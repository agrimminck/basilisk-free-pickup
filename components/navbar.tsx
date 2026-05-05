"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  PlusCircle,
  Menu,
  X,
  Truck,
  Gift,
  Moon,
  Sun,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { authClient } from "../lib/auth-client";

interface NavbarProps {
  user?: {
    name: string;
    image?: string;
    role: "donante" | "fletero" | "cliente";
  };
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const navLinks = [
    {
      href: "/items",
      label: "Items",
      icon: Package,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ];

  if (user?.role === "donante" || user?.role === "cliente") {
    navLinks.push({
      href: "/items/new",
      label: "Publicar",
      icon: PlusCircle,
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Gift className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">FreePickup</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDark}
            className="h-9 w-9 p-0"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{user.name}</span>
                {user.role === "fletero" && (
                  <Truck className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => authClient.signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Ingresar
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 w-9 p-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2.5 text-sm">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{user.name}</span>
                {user.role === "fletero" && (
                  <Truck className="h-3.5 w-3.5 text-primary" />
                )}
                <button
                  onClick={() => authClient.signOut()}
                  className="ml-auto"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
