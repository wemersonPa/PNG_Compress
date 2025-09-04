import React from 'react';
import { Settings } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onSettingsChange({ ...settings, targetSize: isNaN(value) ? 0 : value });
  };

  return (
    <div className="bg-dark-card p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-6 text-light-text">Compression Settings</h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="targetSize" className="block text-sm font-medium text-medium-text mb-2">
            Target Size (KB)
          </label>
          <div className="relative">
             <input
                type="number"
                id="targetSize"
                value={settings.targetSize}
                onChange={handleSizeChange}
                className="w-full bg-dark-bg border border-dark-border rounded-md p-2 text-light-text focus:ring-brand-primary focus:border-brand-primary"
                min="1"
             />
          </div>
           <p className="text-xs text-medium-text mt-2">The compressor will try to get each image below this size.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
