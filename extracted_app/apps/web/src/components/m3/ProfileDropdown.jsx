import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, CreditCard, Gift, LogOut, Shield } from 'lucide-react';

const ProfileDropdown = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.href = '/login';
  };

  if (!currentUser) return null;

  const initials = currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : currentUser.email.substring(0, 2).toUpperCase();
  const avatarUrl = currentUser.avatar ? pb.files.getUrl(currentUser, currentUser.avatar) : '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none ring-0 rounded-full hover:ring-2 hover:ring-primary/20 hover:ring-offset-2 transition-all">
          <Avatar className="h-10 w-10 border border-border shadow-sm">
            <AvatarImage src={avatarUrl} alt={currentUser.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-border p-2">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{currentUser.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {currentUser.email}
            </p>
            {currentUser.role === 'super_admin' && (
              <span className="inline-flex mt-2 items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        
        {currentUser.role === 'super_admin' && (
          <>
            <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-lg hover:bg-muted transition-colors">
              <Link to="/admin">
                <Shield className="mr-2 h-4 w-4 text-primary" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
          </>
        )}

        <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-lg hover:bg-muted transition-colors">
          <Link to="/profile">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-lg hover:bg-muted transition-colors">
          <Link to="/subscription-plans">
            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Subscription Plans</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-lg hover:bg-muted transition-colors">
          <Link to="/invite-earn">
            <Gift className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Invite & Earn</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-lg hover:bg-muted transition-colors">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="p-2 cursor-pointer rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;