import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Local stand-in for a message broker: reads <dir>/<topic>.jsonl and keeps this consumer
 * group's offset in <dir>/<topic>.<group>.offset. Delivery is at-least-once: a crash
 * between handling a message and saving the offset delivers it again.
 */
export class FileQueueConsumer {
  private readonly file: string;
  private readonly offsetFile: string;

  constructor(dir: string, topic: string, group: string) {
    mkdirSync(dir, { recursive: true });
    this.file = join(dir, `${topic}.jsonl`);
    this.offsetFile = join(dir, `${topic}.${group}.offset`);
  }

  /** Handles every message not yet processed by this group. Returns how many it handled. */
  async poll(handle: (payload: unknown) => Promise<void>): Promise<number> {
    if (!existsSync(this.file)) return 0;
    const lines = readFileSync(this.file, "utf8").split("\n").filter(Boolean);
    let offset = existsSync(this.offsetFile) ? Number(readFileSync(this.offsetFile, "utf8")) : 0;
    const start = offset;

    for (; offset < lines.length; offset++) {
      await handle(JSON.parse(lines[offset]));
      writeFileSync(this.offsetFile, String(offset + 1));
    }
    return offset - start;
  }
}
