import YumNavbar from "@/components/navbar";
import YumHeader from "@/components/adminheader";

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <YumNavbar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header/Topbar */}
        <YumHeader />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}