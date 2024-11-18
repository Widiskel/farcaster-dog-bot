import { API } from "./api/api.js";
import logger from "../utils/logger.js";

export default class Core extends API {
  constructor(acc, proxy) {
    super("https://api.farcasterdog.xyz", proxy);
    this.acc = acc;
  }

  async getUserInfo(msg = true) {
    try {
      if (msg) logger.info("Getting user information...");
      const res = await this.fetch(`/api/user/select`, `GET`, this.acc);
      this.user = res[0];
      if (msg) {
        logger.info("Successfully Get user information");
        logger.info(`
fid : ${this.user.fid},
userName : ${this.user.userName},
Point : ${this.user.Point}
`);
      }
    } catch (error) {
      throw error;
    }
  }
  async getMainTask() {
    try {
      logger.info("Getting main task information...");
      const res = await this.fetch(
        `/api/user/all_task/task_main`,
        `POST`,
        this.acc,
        {
          fidId: this.user.fid,
        }
      );
      this.mainTask = res;

      logger.info("Successfully get main task information");
    } catch (error) {
      throw error;
    }
  }
  async getDailyTask() {
    try {
      logger.info("Getting daily task information...");
      const res = await this.fetch(
        `/api/user/all_task/task_daily`,
        `POST`,
        this.acc,
        {
          fidId: this.user.fid,
          limit: 10,
          page: 1,
        }
      );
      this.dailyTask = res;
      logger.info("Successfully get daily task information");
    } catch (error) {
      throw error;
    }
  }
  async completeTask(task) {
    try {
      if (task.clickStatus == null)
        await this.fetch(`/api/user/all_task/task_main`, `POST`, this.acc, {
          taskId: task.taskId,
          fid: this.user.fid,
          taskName: task.taskName,
          clickStatus: null,
        });

      if (task.claimStatus == null)
        await this.fetch(`/api/user/update_point`, `POST`, this.acc, {
          taskId: task.taskId,
          fid: this.user.fid,
          point: task.point,
        });

      await this.getUserInfo(false);
      logger.info(`-> Successfully complete and claim task ${task.taskName}`);
    } catch (error) {
      logger.info(`-> Failed to complete and claim task ${task.taskName}`);
      throw error;
    }
  }
}
