import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import MailApp from '@/components/mail/MailApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <MailApp />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;