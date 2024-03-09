#!/usr/bin/env bun

const main = async () => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/thejasonxie/bun-pkg/main/scripts/bun-pkg.ts"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bun-pkg.ts");
    }

    const text = await response.text();

    console.log(
      `\n\x1b[32mWriting bun-pkg.ts to ./scripts/bun-pkg.ts...\x1b[0m`
    );

    Bun.write("./scripts/bun-pkg.ts", text);

    console.log(
      `\n\x1b[32mAdding bun-pkg.ts to package.json's scripts as pkg...\x1b[0m`
    );

    const pkgJson = await Bun.file("./package.json").json();

    const json = pkgJson as { scripts?: Record<string, string> };
    if (!json["scripts"]) {
      json["scripts"] = {};
    }
    json["scripts"]["pkg"] = "bun scripts/bun-pkg.ts";
    Bun.write("./package.json", JSON.stringify(json, null, 2));

    console.log("\nRun bun pkg --help to see available commands\n");

    console.log(`\n\x1b[32mCompleted...\x1b[0m`);
  } catch (e) {
    console.log("Error fetching bun-pkg.ts: ", e);
    console.log("Try again or see on how to setup manually:");
    console.log("https://github.com/thejasonxie/bun-pkg");
  }
};

main();
