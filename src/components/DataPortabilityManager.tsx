/**
 * Data Portability Manager - Export and import data
 * Features:
 * - Export to JSON, CSV, Markdown
 * - Import from various formats
 * - Backup and restore
 * - Selective export (projects, tasks, etc.)
 * - Data validation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileText, 
  FileSpreadsheet,
  Database,
  CheckCircle,
  AlertTriangle,
  Archive,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

interface DataPortabilityManagerProps {
  projects?: any[];
  tasks?: any[];
  profile?: any;
  onImport?: (data: any) => Promise<void>;
}

export function DataPortabilityManager({
  projects = [],
  tasks = [],
  profile,
  onImport
}: DataPortabilityManagerProps) {
  const [selectedData, setSelectedData] = useState({
    projects: true,
    tasks: true,
    profile: true,
    settings: true
  });
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportToJSON = () => {
    const data: any = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    if (selectedData.projects) data.data.projects = projects;
    if (selectedData.tasks) data.data.tasks = tasks;
    if (selectedData.profile) data.data.profile = profile;
    if (selectedData.settings) {
      data.data.settings = {
        theme: localStorage.getItem('theme'),
        preferences: JSON.parse(localStorage.getItem('user-preferences') || '{}')
      };
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `devtrack-export-${new Date().toISOString().split('T')[0]}.json`);
    
    toast.success('Data exported successfully!');
  };

  const exportToCSV = () => {
    let csv = '';

    if (selectedData.projects && projects.length > 0) {
      csv += 'PROJECTS\n';
      csv += Object.keys(projects[0]).join(',') + '\n';
      projects.forEach(project => {
        csv += Object.values(project).map(v => `"${v}"`).join(',') + '\n';
      });
      csv += '\n';
    }

    if (selectedData.tasks && tasks.length > 0) {
      csv += 'TASKS\n';
      csv += Object.keys(tasks[0]).join(',') + '\n';
      tasks.forEach(task => {
        csv += Object.values(task).map(v => `"${v}"`).join(',') + '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `devtrack-export-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast.success('CSV exported successfully!');
  };

  const exportToMarkdown = () => {
    let md = `# DevTrack Africa Export\n\n`;
    md += `Export Date: ${new Date().toLocaleString()}\n\n`;

    if (selectedData.profile && profile) {
      md += `## Profile\n\n`;
      md += `- Name: ${profile.fullName || 'N/A'}\n`;
      md += `- Email: ${profile.email || 'N/A'}\n`;
      md += `- Bio: ${profile.bio || 'N/A'}\n\n`;
    }

    if (selectedData.projects && projects.length > 0) {
      md += `## Projects (${projects.length})\n\n`;
      projects.forEach(project => {
        md += `### ${project.name}\n\n`;
        md += `- Status: ${project.status}\n`;
        md += `- Description: ${project.description || 'N/A'}\n`;
        if (project.startDate) md += `- Start Date: ${new Date(project.startDate).toLocaleDateString()}\n`;
        if (project.technologies) md += `- Technologies: ${project.technologies.join(', ')}\n`;
        md += `\n`;

        // Tasks for this project
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        if (projectTasks.length > 0 && selectedData.tasks) {
          md += `#### Tasks (${projectTasks.length})\n\n`;
          projectTasks.forEach(task => {
            md += `- [${task.status === 'completed' ? 'x' : ' '}] ${task.title || task.name}\n`;
            if (task.description) md += `  - ${task.description}\n`;
          });
          md += `\n`;
        }
      });
    }

    if (selectedData.tasks && tasks.length > 0) {
      const orphanTasks = tasks.filter(t => !t.projectId);
      if (orphanTasks.length > 0) {
        md += `## Standalone Tasks (${orphanTasks.length})\n\n`;
        orphanTasks.forEach(task => {
          md += `- [${task.status === 'completed' ? 'x' : ' '}] ${task.title || task.name}\n`;
          if (task.description) md += `  - ${task.description}\n`;
        });
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadFile(blob, `devtrack-export-${new Date().toISOString().split('T')[0]}.md`);
    
    toast.success('Markdown exported successfully!');
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      let data;

      // Try to parse as JSON
      try {
        data = JSON.parse(text);
      } catch (error) {
        toast.error('Invalid file format. Please upload a valid JSON export file.');
        setImporting(false);
        return;
      }

      // Validate data structure
      if (!data.data || !data.version) {
        toast.error('Invalid export file structure');
        setImporting(false);
        return;
      }

      setProgress(30);

      // Import data if callback provided
      if (onImport) {
        await onImport(data.data);
      }

      setProgress(100);
      toast.success('Data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      setProgress(0);
      event.target.value = ''; // Reset file input
    }
  };

  const createBackup = () => {
    // Create complete backup including localStorage
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'full-backup',
      data: {
        projects,
        tasks,
        profile,
        localStorage: {
          theme: localStorage.getItem('theme'),
          preferences: JSON.parse(localStorage.getItem('user-preferences') || '{}'),
          filterPresets: {
            task: JSON.parse(localStorage.getItem('task-filter-presets') || '[]'),
            project: JSON.parse(localStorage.getItem('project-filter-presets') || '[]')
          },
          timeEntries: JSON.parse(localStorage.getItem('time-entries') || '[]')
        }
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    downloadFile(blob, `devtrack-backup-${new Date().toISOString().split('T')[0]}.json`);
    
    toast.success('Complete backup created!');
  };

  const getDataSize = () => {
    const dataStr = JSON.stringify({ projects, tasks, profile });
    return (new Blob([dataStr]).size / 1024).toFixed(2); // KB
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Portability
            </CardTitle>
            <CardDescription>
              Export, import, and backup your data
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {getDataSize()} KB
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Select data to export:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-projects"
                    checked={selectedData.projects}
                    onCheckedChange={(checked) =>
                      setSelectedData({ ...selectedData, projects: !!checked })
                    }
                  />
                  <Label htmlFor="export-projects" className="cursor-pointer">
                    Projects ({projects.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-tasks"
                    checked={selectedData.tasks}
                    onCheckedChange={(checked) =>
                      setSelectedData({ ...selectedData, tasks: !!checked })
                    }
                  />
                  <Label htmlFor="export-tasks" className="cursor-pointer">
                    Tasks ({tasks.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-profile"
                    checked={selectedData.profile}
                    onCheckedChange={(checked) =>
                      setSelectedData({ ...selectedData, profile: !!checked })
                    }
                  />
                  <Label htmlFor="export-profile" className="cursor-pointer">
                    Profile Information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-settings"
                    checked={selectedData.settings}
                    onCheckedChange={(checked) =>
                      setSelectedData({ ...selectedData, settings: !!checked })
                    }
                  />
                  <Label htmlFor="export-settings" className="cursor-pointer">
                    Settings & Preferences
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button onClick={exportToJSON} className="gap-2">
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>
              <Button onClick={exportToMarkdown} variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Export Markdown
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                JSON format is recommended for complete data including all metadata. Use CSV or Markdown for human-readable exports.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Alert>
              <AlertDescription className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Important:</p>
                  <p>Importing data will merge with your existing data. Make sure to backup your current data before importing.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h4 className="font-semibold mb-1">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a JSON export file to import data
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file">
                  <Button disabled={importing} asChild>
                    <span className="gap-2">
                      {importing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Importing data... {progress}%
                </p>
              </div>
            )}
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Create a complete backup of all your data, settings, and preferences. This includes everything needed to fully restore your account.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Full Backup</CardTitle>
                <CardDescription>
                  Complete snapshot of your DevTrack data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Projects</div>
                    <div className="font-semibold">{projects.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tasks</div>
                    <div className="font-semibold">{tasks.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Data Size</div>
                    <div className="font-semibold">{getDataSize()} KB</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Backup</div>
                    <div className="font-semibold text-xs">
                      {localStorage.getItem('last-backup-date') || 'Never'}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    createBackup();
                    localStorage.setItem('last-backup-date', new Date().toLocaleDateString());
                  }} 
                  className="w-full gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Create Backup Now
                </Button>
              </CardContent>
            </Card>

            <Alert>
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">Backup Recommendations:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Create regular backups (weekly recommended)</li>
                  <li>Store backups in a secure location</li>
                  <li>Keep multiple backup versions</li>
                  <li>Test your backups periodically</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DataPortabilityManager;

