// Wails runtime - provides bindings to the Go backend
// This file is auto-injected by Wails into the frontend at build time

declare global {
  interface Window {
    runtime: {
      // Window controls
      WindowMinimise(): void;
      WindowMaximise(): void;
      WindowUnmaximise(): void;
      WindowToggleMaximise(): void;
      WindowClose(): void;
      WindowIsMaximised(): boolean;
      WindowFullscreen(): void;
      WindowUnfullscreen(): void;
      WindowIsFullscreen(): boolean;
      WindowSetSize(width: number, height: number): void;
      WindowSetPosition(x: number, y: number): void;
      WindowGetPosition(): Promise<[number, number]>;
      WindowGetSize(): Promise<[number, number]>;

      // System
      OpenURL(url: string): void;
      GetPlatform(): string;
      GetHomeDir(): string;
      GetEnv(key: string): string;
      GetWorkingDir(): string;

      // App info
      GetAppVersion(): string;
      GetAppName(): string;
      OpenConfigFile(): void;

      // Events
      EventsOn(eventName: string, callback: (...data: any[]) => void): void;
      EventsOff(eventName: string): void;
      EventsEmit(eventName: string, ...data: any[]): void;

      // Dialogs
      OpenFileDialog(title: string): Promise<string>;
      SaveFileDialog(title: string, defaultFilename: string): Promise<string>;
      MessageDialog(title: string, message: string): void;

      // Session management (via SessionManager)
      CreateSession(
        shell: string,
        args: string[],
        cwd: string,
        rows: number,
        cols: number,
        profile: string
      ): Promise<any>;
      WriteData(id: string, data: string): Promise<void>;
      ResizeSession(id: string, rows: number, cols: number): Promise<void>;
      CloseSession(id: string): Promise<void>;
      GetSession(id: string): Promise<any>;
      ListSessions(): Promise<any[]>;

      // Config (via ConfigManager)
      GetConfig(): Promise<any>;
      GetConfigValue(key: string): Promise<any>;
      SetConfigValue(key: string, value: any): Promise<void>;
      SetConfig(config: any): Promise<void>;
      GetConfigPath(): Promise<string>;
      GetShell(): Promise<string>;
      GetShellArgs(): Promise<string[]>;
      GetWorkingDirectory(): Promise<string>;
      GetKeymaps(): Promise<any>;
      OpenConfigInEditor(): Promise<void>;
      ProfileConfig(profileName: string): Promise<any>;

      // Agent (via AgentHarness)
      ExecuteCommand(command: string): Promise<any>;
      GetStatus(): Promise<any>;
      HealthCheck(): Promise<any>;

      // MCP (via MCPAggregator)
      ListTools(): Promise<any[]>;
      ListToolsJSON(): Promise<string>;
      CallTool(name: string, args: any): Promise<any>;
      ListServers(): Promise<any[]>;
      AddServer(server: any): Promise<void>;
      GetTelemetry(): Promise<any>;
    };
  }
}

export {};
