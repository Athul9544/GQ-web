const { send, readBody, passwordMatches, issueToken, withConfig } = require('./_lib');

module.exports = withConfig(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const body = await readBody(req);
  if (!passwordMatches(body.password)) {
    return send(res, 401, { error: 'Incorrect password' });
  }
  send(res, 200, { token: issueToken() });
}, ['ADMIN_PASSWORD']);
