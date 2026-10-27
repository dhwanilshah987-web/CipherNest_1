import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FileRecord, StorageStats, VaultSettings } from '../types';
import {
  getAllFiles,
  getStorageStats,
  deleteFile as dbDeleteFile,
  getVaultSettings,
  updateVaultSettings as dbUpdateSettings,
  clearEntireVault as dbClearVault,
  getMasterKey,
} from '../services/db';

interface VaultContextValue {
  files: FileRecord[];
  stats: StorageStats;
  settings: VaultSettings;
  loading: boolean;
  masterKeyReady: boolean;
  refreshVault: () => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  updateSettings: (partial: Partial<VaultSettings>) => Promise<void>;
  clearVault: () => Promise<void>;
}

const defaultStats: StorageStats = {
  totalFiles: 0,
  totalEncryptedSize: 0,
  totalOriginalSize: 0,
  totalBlocks: 0,
  successfulVerifications: 0,
  failedVerifications: 0,
};

const defaultSettings: VaultSettings = {
  defaultBlockSize: 65536,
  autoVerifyOnDownload: true,
  theme: 'system',
  bucketName: 'secureblock-demo-bucket',
  awsRegion: 'us-east-1',
  awsConnectionStatus: 'NOT_CONFIGURED',
  awsConnectionMessage: 'Operating in Demo Environment (Local Vault IndexedDB)',
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [stats, setStats] = useState<StorageStats>(defaultStats);
  const [settings, setSettings] = useState<VaultSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [masterKeyReady, setMasterKeyReady] = useState(false);

  const refreshVault = useCallback(async () => {
    try {
      const [fetchedFiles, fetchedStats, fetchedSettings] = await Promise.all([
        getAllFiles(),
        getStorageStats(),
        getVaultSettings(),
      ]);

      setFiles(fetchedFiles);
      setStats(fetchedStats);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load vault state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await getMasterKey();
        setMasterKeyReady(true);
      } catch (err) {
        console.error('Failed to initialize master key:', err);
      }
      await refreshVault();
    }
    init();
  }, [refreshVault]);

  const deleteFile = async (fileId: string) => {
    await dbDeleteFile(fileId);
    await refreshVault();
  };

  const updateSettings = async (partial: Partial<VaultSettings>) => {
    const updated = await dbUpdateSettings(partial);
    setSettings(updated);
  };

  const clearVault = async () => {
    await dbClearVault();
    await refreshVault();
  };

  return (
    <VaultContext.Provider
      value={{
        files,
        stats,
        settings,
        loading,
        masterKeyReady,
        refreshVault,
        deleteFile,
        updateSettings,
        clearVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
