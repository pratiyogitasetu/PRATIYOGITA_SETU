
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = ({ onClick }: SettingsButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="settings-button absolute top-0 right-0 -translate-y-full h-6 w-6 p-0 bg-white/70 hover:bg-white/90 rounded-full"
      onClick={onClick}
    >
      <Settings className="h-3 w-3" />
    </Button>
  );
};
