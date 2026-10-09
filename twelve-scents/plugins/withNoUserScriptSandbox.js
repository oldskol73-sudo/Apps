// Xcode's "User Script Sandboxing" blocks CocoaPods' [CP] Copy Pods Resources phase from writing
// Pods/resources-to-copy-*.txt, failing Archive. Turn it off for every build configuration.
const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withNoUserScriptSandbox(config) {
  return withXcodeProject(config, (cfg) => {
    const configs = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const settings = configs[key].buildSettings;
      if (settings) settings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
    }
    return cfg;
  });
};
