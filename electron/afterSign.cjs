// electron-builder hook: runs after its own (skipped, no paid cert) signing
// attempt, before the .dmg is assembled. Re-signs the whole app bundle
// ad-hoc so macOS doesn't report "is damaged and can't be opened" —
// electron-builder modifies the bundle (extraResources, Info.plist) after
// Electron's own prebuilt binary already carries an ad-hoc signature,
// which breaks that seal. Apple Silicon requires *some* valid signature to
// run at all; ad-hoc (no paid developer account needed) is enough to get
// back to the normal "unidentified developer" Gatekeeper prompt instead.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  console.log(`[afterSign] ad-hoc signing ${appPath}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], { stdio: "inherit" });
};
