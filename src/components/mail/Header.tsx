import { Copy, Github, Mail, Plus, Database, Eye, EyeOff, Clock, Trash2, Inbox, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { useMailStore } from '@/lib/store';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function Header() {
  const { 
    email, 
    password,
    accountId,
    createdAt,
    quota,
    used,
    loginWithCredentials, 
    createCustomEmail, 
    domains, 
    fetchDomains,
    updateAccountInfo,
    deleteAccount 
  } = useMailStore();
  
  const firstLetter = email ? email[0].toUpperCase() : 'U';
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchDomains();
    const interval = setInterval(updateAccountInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchDomains, updateAccountInfo]);

  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0].domain);
    }
  }, [domains, selectedDomain]);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard');
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await deleteAccount();
    } catch (error) {
      // Error is already handled in the store
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await loginWithCredentials(loginEmail, loginPassword);
      setIsLoginOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      // Error is already handled in the store
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomEmail = async () => {
    if (!customUsername || !selectedDomain || !customPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (customPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createCustomEmail(customUsername, selectedDomain, customPassword);
      setIsCustomEmailOpen(false);
      setCustomUsername('');
      setCustomPassword('');
      setSelectedDomain(domains[0]?.domain || '');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create custom email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomEmailDialogClose = (open: boolean) => {
    if (!isLoading) {
      setIsCustomEmailOpen(open);
      if (!open) {
        setError(null);
        setCustomUsername('');
        setCustomPassword('');
      }
    }
  };

  const usagePercentage = (used / quota) * 100;

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/stackblitz/temp-mail"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Inbox className="h-6 w-6 text-primary" />
            <span>Blinkbox</span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 mx-4" />

        <Button
          variant="ghost"
          className="flex-1 justify-start font-mono text-sm max-w-2xl truncate px-3"
          onClick={copyEmail}
        >
          <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
          {email}
        </Button>

        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>{firstLetter}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Account Details</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Database className="h-3 w-3" /> Account ID
                  </Label>
                  <code className="block text-xs bg-muted p-1 rounded break-all">
                    {accountId}
                  </code>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-1 rounded">{email}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyEmail}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Password
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-1 rounded">
                      {showPassword ? password || 'Not available' : '••••••••'}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyPassword}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created At
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(createdAt)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Database className="h-3 w-3" /> Storage
                  </Label>
                  <div className="text-xs">
                    {formatBytes(used)} of {formatBytes(quota)} used
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }} 
                      title={`${usagePercentage.toFixed(1)}% used`}
                    />
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <Dialog open={isCustomEmailOpen} onOpenChange={handleCustomEmailDialogClose}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Custom Email
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={customUsername}
                        onChange={(e) => setCustomUsername(e.target.value)}
                        placeholder="Enter username"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Select
                        value={selectedDomain}
                        onValueChange={setSelectedDomain}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {domains.map((domain) => (
                            <SelectItem key={domain.domain} value={domain.domain}>
                              @{domain.domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-password">Password</Label>
                      <Input
                        id="custom-password"
                        type="password"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Enter password (min. 8 characters)"
                        disabled={isLoading}
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <Button 
                      className="w-full" 
                      onClick={handleCustomEmail}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Email'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login with Different Account
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Login to Existing Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLoading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}