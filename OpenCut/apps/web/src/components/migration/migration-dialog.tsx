"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Upload, Database, Server } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  migrateLocalDataToServer,
  validateMigration,
  type MigrationProgress,
  type MigrationResult,
} from '@/lib/migration/local-to-server';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MigrationDialog({ open, onOpenChange }: MigrationDialogProps) {
  const [migrationState, setMigrationState] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const startMigration = async () => {
    setMigrationState('migrating');
    setProgress(null);
    setResult(null);

    try {
      const migrationResult = await migrateLocalDataToServer((progressUpdate) => {
        setProgress(progressUpdate);
      });

      setResult(migrationResult);
      setMigrationState(migrationResult.success ? 'completed' : 'error');

      // Run validation after migration
      if (migrationResult.success) {
        const validation = await validateMigration();
        setValidationResult(validation);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationState('error');
      setResult({
        success: false,
        migratedProjects: 0,
        migratedMediaItems: 0,
        migratedTimelines: 0,
        migratedGenerations: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0,
      });
    }
  };

  const resetDialog = () => {
    setMigrationState('idle');
    setProgress(null);
    setResult(null);
    setValidationResult(null);
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'init': return 'Initializing migration...';
      case 'projects': return 'Migrating project metadata...';
      case 'media': return 'Uploading media files...';
      case 'timelines': return 'Migrating timeline data...';
      case 'ai_generations': return 'Migrating AI generations...';
      case 'complete': return 'Migration completed successfully!';
      case 'error': return 'Migration encountered errors';
      default: return 'Processing...';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'projects': return <Database className="h-4 w-4" />;
      case 'media': return <Upload className="h-4 w-4" />;
      case 'timelines': return <Database className="h-4 w-4" />;
      case 'ai_generations': return <Server className="h-4 w-4" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Migrate Data to Server
          </DialogTitle>
          <DialogDescription>
            This will migrate all your local projects, media files, timelines, and AI generations to the server.
            Your data will be accessible from any device after migration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {migrationState === 'idle' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Make sure you're logged in and have a stable internet connection.
                  This process may take several minutes depending on the amount of data.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">Local Data → Server</h3>
                    <p className="text-sm text-muted-foreground">
                      All your projects, media, and timelines will be uploaded
                    </p>
                  </div>
                </div>
                <Button onClick={startMigration}>
                  Start Migration
                </Button>
              </div>
            </div>
          )}

          {migrationState === 'migrating' && progress && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStageIcon(progress.stage)}
                <span className="font-medium">{getStageDescription(progress.stage)}</span>
              </div>

              <Progress value={progress.progress} className="w-full" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Progress:</span>{' '}
                  {progress.processedItems} / {progress.totalItems} items
                </div>
                <div>
                  <span className="text-muted-foreground">Current:</span>{' '}
                  {progress.currentItem}
                </div>
              </div>

              {progress.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.errors.length} error(s) encountered during migration
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {(migrationState === 'completed' || migrationState === 'error') && result && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {result.success ? 'Migration Completed Successfully!' : 'Migration Completed with Errors'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Projects:</span> {result.migratedProjects}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Media Items:</span> {result.migratedMediaItems}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Timelines:</span> {result.migratedTimelines}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">AI Generations:</span> {result.migratedGenerations}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Migration completed in {result.duration} seconds
              </div>

              {validationResult && !validationResult.isValid && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div>Validation found some issues:</div>
                      {validationResult.issues.map((issue: string, index: number) => (
                        <div key={index} className="text-xs">• {issue}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div>Errors encountered:</div>
                      {result.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-xs">• {error}</div>
                      ))}
                      {result.errors.length > 5 && (
                        <div className="text-xs">... and {result.errors.length - 5} more errors</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  Close
                </Button>
                {result.success && (
                  <Button onClick={() => window.location.reload()}>
                    Reload App
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}