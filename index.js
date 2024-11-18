import { accounts } from "./accounts/accounts.js";
import { proxyList } from "./config/proxy_list.js";
import Core from "./src/core/core.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

async function operation(acc, proxy, retryCount = 0) {
  const core = new Core(acc, proxy);
  try {
    await core.getUserInfo();
    await core.getMainTask();
    await core.getDailyTask();

    logger.info(`
Available Main Task : ${core.mainTask.length}
Completed Main Task : ${
      core.mainTask.filter((item) => item.claimStatus == 1).length
    }
Available Daily Task : ${core.dailyTask.length}
Completed Daily Task : ${
      core.dailyTask.filter((item) => item.claimStatus == 1).length
    }
        `);

    for (const task of core.mainTask.filter((item) => item.claimStatus != 1)) {
      await core.completeTask(task);
    }
    for (const task of core.dailyTask.filter((item) => item.claimStatus != 1)) {
      await core.completeTask(task);
    }
  } catch (error) {
    let msg = `Error : `;
    msg += error.message;
    logger.error(msg);

    if (Helper.errorIs(error, 204)) {
      throw Error(`${msg}, Check your token`);
    } else if (Helper.errorIs(error, 404) || Helper.errorIs(error, 503)) {
      throw Error(`Detect API Change Stopping bot`);
    }

    if (retryCount < 3) {
      logger.info(`Retrying in 5 seconds...`);
      await Helper.delay(5000);
      await operation(acc, proxy, retryCount + 1);
    } else {
      logger.error("Max retries reached. Stopping operation.");
    }
  }
}

async function startBot() {
  try {
    logger.info(`BOT STARTED\n`);

    if (accounts.length == 0)
      throw Error("Please input your account first in the accounts.js file");

    if (proxyList.length > 0) {
      if (proxyList.length != accounts.length) {
        throw Error(
          `You have ${accounts.length} accounts but provided ${proxyList.length} proxies`
        );
      }
    }

    for (const acc of accounts) {
      const proxy = proxyList[accounts.indexOf(acc)];
      await operation(acc, proxy);
    }

    await Helper.delay(60 * 60 * 24 * 1000, `All Accounts Processing Complete`);

    await startBot();
  } catch (error) {
    logger.info(`BOT STOPPED`);
    logger.error(JSON.stringify(error));
    throw error;
  }
}

(async () => {
  try {
    logger.clear();
    logger.info("Application Started");
    logger.info(`${Helper.botName} BOT`);
    logger.info();
    logger.info("By : Widiskel");
    logger.info("Follow On : https://github.com/Widiskel");
    logger.info("Join Channel : https://t.me/skeldrophunt");
    logger.info("Don't forget to run git pull to keep up to date");
    logger.info();
    logger.info();
    Helper.showSkelLogo();

    await startBot();
  } catch (error) {
    logger.info("Error during execution", error);
    await startBot();
  }
})();
