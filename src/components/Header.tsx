import { Bike, Menu, User, Calendar, CreditCard, LogOut, Search, Bell, CheckCircle, XCircle, Trash2, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import type { Page, User as UserType, Notification } from '../App';

interface HeaderProps {
  user: UserType | null;
  isGuest: boolean;
  currentPage: Page;
  navigate: (page: Page) => void;
  logout: () => void;
  hideSearchBar?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
}

export function Header({ user, isGuest, currentPage, navigate, logout, hideSearchBar = false, searchTerm = '', onSearchChange, notifications = [], onNotificationClick, onMarkAllRead, onClearAll }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout(); // Call the parent's logout to clear local state
      toast.success('Logged out successfully');
      navigate('landing');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container-custom h-16">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('landing')}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bike className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl text-primary font-heading font-bold">
              MotoRent
            </span>
          </div>

          {/* Search Bar - hidden on mobile */}
          {!hideSearchBar && (
            <div className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search motorcycles..."
                  className="pl-9 bg-muted border-0 font-body"
                  value={searchTerm}
                  onChange={(e) => {
                    if (onSearchChange) {
                      onSearchChange(e.target.value);
                      // Navigate to home page if not already there
                      if (currentPage !== 'home') {
                        navigate('home');
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Navigation Links + User Profile - Equal spacing */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('home')}
                className={`text-label btn-hover hover:bg-accent hover:text-accent-foreground whitespace-nowrap ${
                  currentPage === 'home' ? 'bg-accent/10 text-accent' : ''
                }`}
              >
                Motorcycles
              </Button>
              
              {!isGuest && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('reservations')}
                    className={`text-label btn-hover hover:bg-accent hover:text-accent-foreground whitespace-nowrap ${
                      currentPage === 'reservations' ? 'bg-accent/10 text-accent' : ''
                    }`}
                  >
                    Reservations
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('transactions')}
                    className={`text-label btn-hover hover:bg-accent hover:text-accent-foreground whitespace-nowrap ${
                      currentPage === 'transactions' ? 'bg-accent/10 text-accent' : ''
                    }`}
                  >
                    Transactions
                  </Button>
                </>
              )}
            </nav>

            {/* User Profile Section - Equal spacing */}
            {isGuest ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline font-body">Guest</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('login')}
                  className="btn-hover border-border hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
                >
                  Login
                </Button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                {/* Notification Icon */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative btn-hover hover:bg-accent hover:text-accent-foreground">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-label">Notifications</h3>
                        {unreadCount > 0 && onMarkAllRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onMarkAllRead}
                            className="text-xs h-7 btn-hover hover:bg-accent hover:text-accent-foreground"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      {notifications.length > 0 && onClearAll && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={onClearAll}
                          className="w-full text-xs h-8 btn-hover hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Clear All Notifications
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground font-body">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => {
                                if (onNotificationClick) {
                                  onNotificationClick(notification);
                                }
                              }}
                              className={`w-full p-4 text-left transition-colors hover:bg-accent/50 ${
                                !notification.read ? 'bg-accent/10' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className={`flex-shrink-0 mt-1 ${
                                  notification.type === 'success' || notification.type === 'confirmed' ? 'text-green-600' : 
                                  notification.type === 'error' || notification.type === 'rejected' ? 'text-red-600' :
                                  notification.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                }`}>
                                  {(notification.type === 'success' || notification.type === 'confirmed') ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <XCircle className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-body ${!notification.read ? 'font-semibold' : ''}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground font-body mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-body mt-2">
                                    {formatTimeAgo(notification.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2 btn-hover hover:bg-accent hover:text-accent-foreground">
                      <Avatar className="w-8 h-8">
                        {user.profile_picture_url ? (
                          <>
                            <AvatarImage 
                              src={user.profile_picture_url} 
                              alt={user.name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="hidden lg:inline text-label">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuItem onClick={() => navigate('profile')} className="font-body">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('reservations')} className="font-body">
                      <Calendar className="w-4 h-4 mr-2" />
                      My Reservations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('transactions')} className="font-body">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Transactions
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('settings')} className="font-body">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="font-body">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="btn-hover hover:bg-accent hover:text-accent-foreground">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuItem onClick={() => navigate('home')} className="font-body">
                    Motorcycles
                  </DropdownMenuItem>
                  {!isGuest && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('reservations')} className="font-body">
                        My Reservations
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('transactions')} className="font-body">
                        Transactions
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}