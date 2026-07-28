const { send, validToken, withConfig } = require('./_lib');

module.exports = withConfig(async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  send(res, 200, { valid: validToken(req) });
});
