import { AdminUser, Page } from '../../App';
import { 
  LayoutDashboard, 
  Bike, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  LogOut,
  Shield,
  ChevronLeft,
  Menu,
  MapPin,
  Users,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { contactService } from '../../services/contactService';
import { supabase } from '../../lib/supabase';

interface AdminSidebarProps {
  adminUser: AdminUser;
  currentPage: Page;
  navigate: (page: Page) => void;
  logout: () => void;
}

export function AdminSidebar({ adminUser, currentPage, navigate, logout }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Fetch new message count
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const messages = await contactService.getAllMessages();
        const newCount = messages.filter(msg => msg.status === 'new').length;
        setNewMessageCount(newCount);
      } catch (error) {
        console.error('Error fetching message count:', error);
      }
    };

    fetchMessageCount();

    // Subscribe to real-time updates for message status changes
    const channel = supabase
      .channel('contact_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          // When a message status changes, refetch the count
          if (payload.new?.status !== payload.old?.status) {
            fetchMessageCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          // When a new message is inserted, refetch the count
          fetchMessageCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const navItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-motorcycles', label: 'Motorcycles', icon: Bike },
    { id: 'admin-reservations', label: 'Reservations', icon: Calendar },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-messages', label: 'Messages', icon: MessageSquare },
    { id: 'admin-transactions', label: 'Transactions', icon: FileCheck },
    { id: 'admin-gps', label: 'GPS Tracking', icon: MapPin },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigation = (page: Page) => {
    navigate(page);
    setIsMobileOpen(false); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-card border border-border rounded-lg shadow-sm text-foreground hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-card border-r border-border shadow-lg transition-all duration-300
        lg:static lg:shadow-none
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0 z-[60]' : '-translate-x-full lg:translate-x-0 lg:z-auto'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-lg">M</span>
                  </div>
                  <div>
                    <h1 className="font-heading font-bold text-lg text-foreground">
                      MotoRent
                    </h1>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-accent" />
                      <span className="text-xs font-medium text-accent">Admin Panel</span>
                    </div>
                  </div>
                </div>
              )}
              
              {isCollapsed && (
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-white font-heading font-bold text-lg">M</span>
                </div>
              )}

              {/* Collapse Button - Hidden on mobile */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isMessagesItem = item.id === 'admin-messages';
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id as Page)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="font-medium">{item.label}</span>
                      {isMessagesItem && newMessageCount > 0 && (
                        <div className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-accent text-white rounded-full text-xs font-bold">
                          {newMessageCount}
                        </div>
                      )}
                    </div>
                  )}
                  {isCollapsed && isMessagesItem && newMessageCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-accent text-white text-xs rounded-full font-bold">
                      {newMessageCount}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin User Profile */}
          <div className="p-4 border-t border-border">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {adminUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {adminUser.name}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {adminUser.role}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className={`
                w-full mt-3 flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-accent hover:bg-accent/10 
                rounded-lg transition-colors
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}