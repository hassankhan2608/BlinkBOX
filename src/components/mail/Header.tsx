import { Copy, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { useMailStore } from '@/lib/store';
import { toast } from 'sonner';

export function Header() {
  const { email } = useMailStore();

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Mail className="h-5 w-5" />
          <span>TempMail</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Button
            variant="outline"
            className="font-mono text-sm"
            onClick={copyEmail}
          >
            {email}
            <Copy className="ml-2 h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}