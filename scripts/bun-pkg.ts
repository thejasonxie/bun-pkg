// Downloaded with 'bunx bun-pkg' from:
// https://github.com/thejasonxie/bun-pkg

import { $ } from "bun";
import { parseArgs } from "util";

const startTime = performance.now();

const BUN_COMMANDS = [
  "build",
  "install",
  "add",
  "run",
  "update",
  "link",
  "unlink",
  "remove",
  "create",
  "upgrade",
  "discord",
  "test",
  "pm",
  "x",
  "repl",
  "init",
];

// https://github.com/oven-sh/bun/blob/main/src/cli.zig#L1328
const BUN_RESERVED_COMMANDS = [
  "deploy",
  "cloud",
  "info",
  "config",
  "use",
  "auth",
  "login",
  "logout",
  "whoami",
  "publish",
  "prune",
  "outdated",
  "list",
  "why",
];

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    a: {
      type: "boolean",
    },
    all: {
      type: "boolean",
    },
    n: {
      type: "boolean",
    },
    new: {
      type: "boolean",
    },
    "use-config": {
      type: "boolean",
    },
    h: {
      type: "boolean",
    },
    help: {
      type: "boolean",
    },
  },
  strict: false,
  allowPositionals: true,
});

const packages = (await $`ls packages`.text()).split("\n");
if (packages[packages.length - 1].length === 0) packages.pop();

const listPackages = () => {
  console.log("\n\x1b[1mPackages:\x1b[0m");
  console.log(packages.length > 0 ? packages.join("\n") : "No packages found");
};

const help = (exitCode: number) => {
  console.log(
    "\n\x1b[1mA monorepo manager for bun workspaces (bun-pkg)\x1b[0m"
  );
  console.log("\nUsage: bun pkg [...flags] [package-name] <command>");

  console.log("\n\x1b[1mFlags:\x1b[0m");
  console.log("  -a, --all    Run the command in all packages.");
  console.log("  -h, --help   Show this help message.");
  console.log("  -n, --new    Create a new package.");
  console.log(
    "  --use-config Use the configuration file in root `bun-pkg.json` to set new package.json file."
  );

  console.log("\n\x1b[1mCommands:\x1b[0m");
  console.log(
    "Any commands that you want to run within the package directory."
  );

  listPackages();

  process.exit(exitCode);
};

const endTimer = (msg?: string) => {
  const endTime = performance.now();
  const ms = endTime - startTime;
  const unit = ms < 1000 ? "ms" : ms < 60000 ? "s" : ms < 3600000 ? "m" : "h";
  const time =
    ms < 1000
      ? ms
      : ms < 60000
      ? ms / 1000
      : ms < 3600000
      ? ms / 60000
      : ms / 3600000;
  console.log(
    `\x1b[32m${msg ? `${msg} completed` : "Completed"} in ${
      Math.round(time * 100) / 100
    } ${unit}.\x1b[0m`
  );
};

const checkPkgExists = (pkg: string, exists: boolean) => {
  if (!packages.includes(pkg) && exists) {
    console.log(`Package directory "${pkg}" does not exist.`);
    console.log(
      `If you want to create a new package, use "bun pkg -n <package-name> <command>"`
    );
    console.log(`Otherwise, these are the available packages:`);
    listPackages();
    process.exit(1);
  }
  if (packages.includes(pkg) && !exists) {
    console.log(
      `Package directory "${pkg}" already exists. Try a different package name.`
    );
    process.exit(1);
  }
};

const execPkgCommand = async (pkg: string, command: string) => {
  if (
    BUN_COMMANDS.includes(command.split(" ")[0]) ||
    BUN_RESERVED_COMMANDS.includes(command.split(" ")[0])
  ) {
    console.log(
      `\x1b[32mRunning "bun ${command}" in package "${pkg}"...\x1b[0m`
    );
    await $`cd packages/${pkg} && bun ${{ raw: command }}`;
  } else {
    console.log(`\x1b[32mRunning "${command}" in package "${pkg}"...\x1b[0m`);
    const idx = Bun.argv.findIndex((arg) => arg === command.split(" ")[0]);
    command = Bun.argv.slice(idx).join(" ");
    await $`cd packages/${pkg} && ${{ raw: command }}`;
  }
};

const execAllPkgCommand = async (command: string) => {
  for (const pkg of packages) {
    await execPkgCommand(pkg, command);
  }
  endTimer(`All ${packages.length} packages`);
  process.exit(0);
};

const execSinglePkgCommand = async (pkg: string, command: string) => {
  checkPkgExists(pkg, true);

  if (!command) {
    console.log(
      `No command provided. Provide a command to run within the package ${pkg} directory.`
    );
    process.exit(1);
  }

  await execPkgCommand(pkg, command);
  endTimer();
  process.exit(0);
};

if (values.h || values.help) {
  help(values.h || values.help ? 0 : 1);
}

if ((values.a || values.all) && !(values.n || values.new)) {
  if (positionals.length >= 3) {
    const command = positionals.splice(2).join(" ");
    await execAllPkgCommand(command);
  } else {
    console.log(
      "Provide a command to run in all packages. eg. bun pkg -a run build"
    );
    process.exit(1);
  }
}

if ((values.n || values.new) && !(values.a || values.all)) {
  if (positionals.length >= 4) {
    const pkg = positionals[2];
    const command = positionals.splice(3).join(" ");

    checkPkgExists(pkg, false);

    console.log(
      `Creating new package "${pkg}" with command "bun ${command}" in packages/${pkg}...`
    );

    await $`mkdir packages/${pkg}`;
    await execPkgCommand(pkg, command);

    // Apply configurations to the new package
    if (
      values["use-config"] &&
      (await $`ls`.text()).split("\n").includes("bun-pkg.json")
    ) {
      console.log(
        `\x1b[32mApplying 'bun-pkg.json' config to ${pkg}'s package.json file...\x1b[0m`
      );
      const config = JSON.parse(
        (await $`cat bun-pkg.json`.text()).replace(/\$\{PACKAGE\}/g, pkg)
      );

      if (Object.keys(config).length > 0) {
        const pkgJson = JSON.parse(
          await $`cat packages/${pkg}/package.json`.text()
        );
        const obj = [
          "scripts",
          "dependencies",
          "devDependencies",
          "peerDependencies",
        ];

        for (const key in config) {
          if (!obj.includes(key)) {
            pkgJson[key] = config[key];
          }
        }

        // order keys
        const keyOrder = Object.keys(config).filter(
          (key) => !obj.includes(key)
        );

        const sortedPkgJson: any = {};
        for (const key of keyOrder) {
          if (pkgJson[key]) {
            sortedPkgJson[key] = pkgJson[key];
          }
        }
        for (const key in pkgJson) {
          if (!keyOrder.includes(key)) {
            sortedPkgJson[key] = pkgJson[key];
          }
        }

        // append the rest of the keys to objects
        if (obj.some((key) => config[key])) {
          for (const key of obj) {
            if (config[key]) {
              for (const value in config[key]) {
                sortedPkgJson[key][value] = config[key][value];
              }
            }
          }
        }

        await $`echo '${JSON.stringify(
          sortedPkgJson,
          null,
          2
        )}' > packages/${pkg}/package.json`;
      }
    }

    endTimer();
    process.exit(0);
  } else {
    if (positionals.length < 3) {
      console.log("Provide a name for the new package.");
    } else {
      console.log("Provide a command for creating a new package.");
      console.log(
        'eg. "bun pkg -n <package-name> create vite" is same as "bun create vite ." in /packages/<package-name> directory'
      );
      console.log(
        'eg. "bun pkg -n <package-name> init" is same as "bun init" in /packages/<package-name> directory'
      );
    }
    process.exit(1);
  }
}

if (positionals.length < 3) {
  help(1);
} else {
  const pkg = positionals[2];
  const command = positionals.splice(3).join(" ");
  await execSinglePkgCommand(pkg, command);
}

// if reached here, something went wrong
help(1);
