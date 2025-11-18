import * as fs from 'fs-extra';
import SwiftletTask from './SwiftletTask';

class DeleteTask extends SwiftletTask {
  private readonly paths: string[];

  public constructor(paths: string[]) {
    super();
    this.paths = paths;
  }

  async runImpl(): Promise<boolean> {
    try {
      for (const file of this.paths) {
        if (fs.existsSync(file)) {
          await fs.remove(file);
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default DeleteTask;
