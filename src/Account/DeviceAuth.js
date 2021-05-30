const readline = require('readline');
const fsp = require('fs').promises;

const DEVICE_AUTH = 'https://account-public-service-prod.ol.epicgames.com/account/api/public/account';
const CSRF_TOKEN = 'https://www.epicgames.com/id/api/csrf';
const OAUTH_TOKEN = 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token';
const LOGIN_FRONTEND = 'https://www.epicgames.com/id'
const IOS_TOKEN = 'MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE='
const STRATEGY_FLAGS = 'guardianEmailVerifyEnabled=false;guardianEmbeddedDocusignEnabled=true;registerEmailPreVerifyEnabled=false;unrealEngineGamingEula=true';
module.exports = class DeviceAuth {
  constructor(client) {
    this.client = client;
  }

  async consolePrompt(query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }));
  };

  async readDeviceAuth(path) {
    try {
      return require(path);
    } catch (err) {
      console.log(err);
      return {};
    }
  }

  async getXSRF() {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Epic-Strategy-Flags': STRATEGY_FLAGS,
      Referer: `${LOGIN_FRONTEND}/login`,
    };

    await this.client.http.sendGet(`${CSRF_TOKEN}`, null, null, true, headers);

    return this.client.http.jar.getCookies(`${LOGIN_FRONTEND}`)
      .find(cookie => cookie.key === 'XSRF-TOKEN')
      .value;
  }

  async getTokenWithDeviceAuth(email) {
    const auths = await this.readDeviceAuth(this.client.config.rememberDevicesPath);
    let deviceId = null;
    let deviceAccountId = null;
    let deviceSecret = null;

    if (auths[email]) {
      deviceId = auths[email].device_id;
      deviceAccountId = auths[email].account_id;
      deviceSecret = auths[email].secret;
   }

    if (!deviceId || !deviceAccountId || !deviceSecret) {
      const create = await this.createSessionDeviceAuth(email);
      if (create.error) return create;
    }

    const exchangeData = {
      grant_type: 'device_auth',
      account_id: deviceAccountId,
      device_id: deviceId,
      secret: deviceSecret,
    };

    const token = await this.client.http.sendPost(OAUTH_TOKEN,
      `basic ${IOS_TOKEN}`,
      exchangeData,
      {'Content-Type': 'application/x-www-form-urlencoded'}, true);

    if (token.error) return token;
    return token;
  }

  async createSessionDeviceAuth(email) {
    return await this.createDeviceAuthFromExchangeCode(email)
  }

  async createDeviceAuthFromExchangeCode(email) {
    const code = await this.consolePrompt(
      'To generate device auth, please provide an exchange code for the email: ' + email + ' : '
    );

    const xsrf = await this.getXSRF();
    if (!xsrf) return {error: 'Failed querying CSRF endpoint with a valid response of XSRF-TOKEN'};

    const headers = {
      'x-xsrf-token': xsrf,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const exchangeData = {
      grant_type: 'exchange_code',
      exchange_code: code,
      includePerms: true,
      token_type: 'eg1',
    };

    const res = await this.client.http.sendPost(
      OAUTH_TOKEN,
      `basic ${IOS_TOKEN}`,
      exchangeData,
      true,
      headers);

    if (res.error) return res;

    return this.createDeviceAuthWithExchange(res, email);
  }

  async createDeviceAuthWithExchange(token, email) {
    const deviceAuthDetails = await this.client.http.sendPost(
      `${DEVICE_AUTH}/${token.data.account_id}/deviceAuth`,
      `bearer ${token.data.access_token}`
    );

    if (deviceAuthDetails.error) return {success: false, error: deviceAuthDetails.error};

    const saved = await this.persist({
      path: this.client.config.rememberDevicesPath,
      email: email,
      deviceId: deviceAuthDetails.data.deviceId,
      deviceAccountId: deviceAuthDetails.data.accountId,
      deviceSecret: deviceAuthDetails.data.secret
    });

    if (!saved.success) return saved;

    return {
      email: email,
      deviceId: deviceAuthDetails.data.deviceId,
      deviceAccountId: deviceAuthDetails.data.accountId,
      deviceSecret: deviceAuthDetails.data.secret
    };
  }

  async persist({path, email, deviceId, deviceAccountId, deviceSecret}) {
    if (!email) return {success: false, error: 'No email set to client.'};
    if (!deviceId) return {success: false, error: 'No available device id set.'};
    if (!deviceAccountId) return {success: false, error: 'No device account id set.'};
    if (!deviceSecret) return {success: false, error: 'No device secret set.'};

    const persistedData = await this.readDeviceAuth(path);

    if (typeof persistedData[email] === 'undefined') Object.assign(persistedData, {[email]: []});

    persistedData[email].push({
      deviceId: deviceId,
      accountId: deviceAccountId,
      secret: deviceSecret,
    });

    await fsp.writeFile(path, JSON.stringify(persistedData));

    return {success: true};
  }
}


