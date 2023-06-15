import chalk from "chalk";
import figlet from "figlet";

export const printLogo = () => {
  console.clear();
  console.log(figlet.textSync("Space Jumper"));
};

export const printEnvironment = (source: string, target: string) => {
  console.log(`\nSource: ${source}`);
  console.log(`Target: ${target}\n`);
};

export const printKey = () => {
  console.log(chalk.red("-  old"));
  console.log(chalk.green("+  new"));
  console.log("\n");
};
