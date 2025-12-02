import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Localization System</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage translations for all applications</p>
        <Link to="/localization">
          <Button size="lg" className="gap-2">
            <Languages className="h-5 w-5" />
            Go to Localization Management
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
