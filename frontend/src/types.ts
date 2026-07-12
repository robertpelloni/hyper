export interface TermColors {
	black: string;
	red: string;
	green: string;
	yellow: string;
	blue: string;
	magenta: string;
	cyan: string;
	white: string;
	lightBlack: string;
	lightRed: string;
	lightGreen: string;
	lightYellow: string;
	lightBlue: string;
	lightMagenta: string;
	lightCyan: string;
	lightWhite: string;
	limeGreen?: string;
	lightCoral?: string;
}

export interface AppConfig {
	updateChannel?: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string;
	fontWeightBold?: string;
	lineHeight?: number;
	letterSpacing?: number;
	scrollback?: number;
	cursorColor?: string;
	cursorAccentColor?: string;
	cursorShape?: "BLOCK" | "BEAM" | "UNDERLINE";
	cursorBlink?: boolean;
	foregroundColor?: string;
	backgroundColor?: string;
	selectionColor?: string;
	borderColor?: string;
	css?: string;
	termCSS?: string;
	workingDirectory?: string;
	padding?: string;
	colors?: TermColors;
	shell?: string;
	shellArgs?: string[];
	env?: Record<string, string>;
	bell?: string;
	copyOnSelect?: boolean;
	quickEdit?: boolean;
	macOptionSelectionMode?: string;
	webGLRenderer?: boolean;
	webLinksActivationKey?: string;
	disableLigatures?: boolean;
	preserveCWD?: boolean;
	screenReaderMode?: boolean;
	imageSupport?: boolean;
	defaultProfile?: string;
	profiles?: Array<{ name: string; config: Partial<AppConfig> }>;
	windowSize?: [number, number];
	windowPosition?: [number, number];
	showHamburgerMenu?: string;
	showWindowControls?: string;
	useConpty?: boolean;
}

export interface SessionInfo {
	uid: string;
	shell: string;
	pid: number;
	rows: number;
	cols: number;
	profile: string;
	title?: string;
	search?: boolean;
	hasActivity?: boolean;
}

export interface TabInfo {
	uid: string;
	title: string;
	isActive: boolean;
	hasActivity: boolean;
	sessions: string[];
}

export interface SplitDirection {
	type: "HORIZONTAL" | "VERTICAL";
}

export interface TermGroup {
	uid: string;
	sessionUid: string | null;
	parentUid: string | null;
	direction: SplitDirection | null;
	sizes: number[] | null;
	children: string[];
}

export interface Notification {
	id: string;
	text: string;
	url?: string | null;
	dismissable: boolean;
	timestamp: number;
}

export interface AgentStatus {
	status: string;
	running: boolean;
	messages: number;
	timestamp?: number;
}

export interface MCPTool {
	name: string;
	description: string;
	inputSchema: Record<string, any>;
}

export interface MCPTelemetry {
	status: string;
	active_tools: number;
	servers: number;
	version: string;
}
