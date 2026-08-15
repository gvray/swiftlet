import path from 'node:path';
abstract class SwiftletTask {
  private readonly appRoot: string;
  protected readonly env: string | undefined;

  constructor() {
    let cwd = process.cwd();
    const appRoot = process.env.APP_ROOT;
    if (appRoot) {
      cwd = path.isAbsolute(appRoot) ? appRoot : path.join(cwd, appRoot);
    }
    this.appRoot = cwd;
    this.env = process.env.NODE_ENV;
  }

  getName(): string {
    return this.constructor.name;
  }

  getAppRoot(): string {
    return this.appRoot;
  }

  async run(): Promise<boolean> {
    return await this.runImpl();
  }
  abstract runImpl(): Promise<boolean>;
}

export default SwiftletTask;
