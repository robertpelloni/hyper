// Re-implementation of Goose's Session and Memory Management

import { Message } from './provider_interface';

export class Session {
  public id: string;
  public history: Message[] = [];

  constructor(id: string) {
    this.id = id;
  }

  public addMessage(message: Message) {
    this.history.push(message);
  }

  public getHistory(): Message[] {
    return this.history;
  }
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  public createSession(id: string): Session {
    const session = new Session(id);
    this.sessions.set(id, session);
    return session;
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  public clearSession(id: string) {
    this.sessions.delete(id);
  }
}
