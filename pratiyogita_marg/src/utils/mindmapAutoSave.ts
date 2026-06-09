
import { MindMapData } from '@/components/mindmap/types';
import { saveMindMap } from './mindmapStorage';

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  lastSaveTime: number;
}

// Default configuration
export const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: false,
  interval: 60000, // 1 minute by default
  lastSaveTime: 0
};

// Create the auto-save configuration in local storage if it doesn't exist
export const initAutoSaveConfig = (): AutoSaveConfig => {
  try {
    const storedConfig = localStorage.getItem('mindmapAutoSaveConfig');
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
    
    // Set defaults if no stored configuration
    localStorage.setItem('mindmapAutoSaveConfig', JSON.stringify(DEFAULT_AUTO_SAVE_CONFIG));
    return DEFAULT_AUTO_SAVE_CONFIG;
  } catch (error) {
    console.error('Error initializing auto-save config:', error);
    return DEFAULT_AUTO_SAVE_CONFIG;
  }
};

// Save the auto-save configuration to local storage
export const saveAutoSaveConfig = (config: AutoSaveConfig): void => {
  try {
    localStorage.setItem('mindmapAutoSaveConfig', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving auto-save config:', error);
  }
};

// Check if auto-save should run now based on the interval
export const shouldAutoSave = (config: AutoSaveConfig): boolean => {
  if (!config.enabled) return false;
  
  const now = Date.now();
  return now - config.lastSaveTime >= config.interval;
};

// Perform the actual auto-save operation
export const performAutoSave = async (data: MindMapData, config: AutoSaveConfig): Promise<AutoSaveConfig> => {
  if (!data.name || !config.enabled) return config;
  
  try {
    await saveMindMap(data);
    
    // Update the last save time
    const updatedConfig = {
      ...config,
      lastSaveTime: Date.now()
    };
    
    saveAutoSaveConfig(updatedConfig);
    return updatedConfig;
  } catch (error) {
    console.error('Auto-save failed:', error);
    return config;
  }
};
