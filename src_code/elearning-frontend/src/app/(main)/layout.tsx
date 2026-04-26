import { ReactNode } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopHeader from "@/components/layouts/TopHeader";
import Footer from "@/components/layouts/Footer";
import Authentication from "@/components/organisms/Authentication";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-20 flex flex-col">
        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="flex-1 pt-16">{children}</main>

        {/* Footer */}
        <Footer />
      </div>

      <Authentication />
    </div>
  );
}
