import { Copy, Mail, Plus } from 'lucide-react';
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

export function Header() {
  const { email, password, loginWithCredentials, createCustomEmail, domains, fetchDomains } = useMailStore();
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

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

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

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Mail className="h-5 w-5" />
          <span>BlinkMail</span>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          className="flex-1 justify-start font-mono text-sm max-w-2xl truncate px-3"
          onClick={copyEmail}
        >
          <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
          {email}
        </Button>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>{firstLetter}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <DropdownMenuLabel>Account Details</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copyEmail}>
                <div className="w-full">
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {email}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyPassword}>
                <div className="w-full">
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {password || 'Not available'}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog open={isCustomEmailOpen} onOpenChange={handleCustomEmailDialogClose}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}