
import { EventData } from './types';

export class EventBuffer {
  private buffer: EventData[] = [];

  add(eventData: EventData): number {
    this.buffer.push(eventData);
    return this.buffer.length;
  }

  flush(): EventData[] {
    const events = [...this.buffer];
    this.buffer = [];
    return events;
  }

  size(): number {
    return this.buffer.length;
  }

  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  addBackToBuffer(events: EventData[]): void {
    this.buffer.unshift(...events);
  }
}
