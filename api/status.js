/**
 * Setup diagnostics. Deliberately outside withConfig so it answers even when
 * nothing is configured — that is exactly when you need it.
 *
 * Reports only whether each variable is present, never its value, so it is
 * safe to leave reachable.
 */
const { send, missingConfig, deploymentInfo } = require('./_lib');

module.exports = (req, res) => {
  const missing = missingConfig();
  send(res, 200, {
    configured: missing.length === 0,
    missing,
    present: {
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
      GITHUB_TOKEN: Boolean(process.env.GITHUB_TOKEN),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET)   // optional
    },
    deployment: deploymentInfo()
  });
};
