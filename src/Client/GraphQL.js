
const GRAPHQL = require('../../resources/GraphQL');

class GraphQL {

  constructor(http, debug) {
    this.http = http;
    this.debug = debug;
  }

  assign(target) {
    for (let query in GRAPHQL.queries) {
      target[query] = this[query].bind(this);
    }

    for (let mutation in GRAPHQL.mutations) {
      target[mutation] = this[mutation].bind(this);
    }

    target.redeemProductCode = this.redeemCodeMutation.bind(this);
  }

  async exec(query, variables = {}) {
    const { data } = await this.http.sendGraphQL(null, query, variables);

    return JSON.parse(data);
  }

  async accountQuery(locale, countryCode) {
    return await this.exec(GRAPHQL.queries.accountQuery, { locale, countryCode });
  }

  async bulkWishlistQuery(bulkQueryRequest) {
    return await this.exec(GRAPHQL.queries.bulkWishlistQuery, { bulkQueryRequest });
  }

  async catalogQuery(namespace, id, locale, withOffers) {
    return await this.exec(GRAPHQL.queries.catalogQuery, { namespace, id, locale, withOffers });
  }

  async discoverMeta(layoutSlug, locale) {
    return await this.exec(GRAPHQL.queries.discoverMeta, { layoutSlug, locale });
  }

  async discoverTitle(layoutSlug, locale) {
    return await this.exec(GRAPHQL.queries.discoverTitle, { layoutSlug, locale });
  }

  /**
   * Returns evaluation of product code.
   * @param {string} codeId
   * @param {string} locale
   */
  async evaluateCodeQuery(codeId, locale = 'en-US') {
    try {

      return await this.exec(GRAPHQL.queries.evaluateCodeQuery, { codeId, locale });

    } catch (err) {

      this.debug.print(new Error(err));

      return false;
    }
  }

  async feedQuery(locale, countryCode) {
    return await this.exec(GRAPHQL.queries.feedQuery, { locale, countryCode });
  }

  async fetchMediaRef(mediaRefId) {
    return await this.exec(GRAPHQL.queries.fetchMediaRef, { mediaRefId });
  }

  async fetchPrerequisites(offerParams) {
    return await this.exec(GRAPHQL.queries.fetchPrerequisites, { offerParams });
  }

  async getAddonsByNamespace(categories, count, country, locale, namespace, sortBy, sortDir) {
    return await this.exec(GRAPHQL.queries.getAddonsByNamespace, { categories, count, country, locale, namespace, sortBy, sortDir });
  }

  async getCoupons(currencyCountry, identityId) {
    return await this.exec(GRAPHQL.queries.getCoupons, { currencyCountry, identityId });
  }

  async getLastCatalogUpdate() {
    return await this.exec(GRAPHQL.queries.getLastCatalogUpdate);
  }

  async getNs(namespace) {
    return await this.exec(GRAPHQL.queries.getNs, { namespace });
  }

  async getSalesEventData() {
    return await this.exec(GRAPHQL.queries.getSalesEventData);
  }

  async getSalesEventDataById(salesEventId) {
    return await this.exec(GRAPHQL.queries.getSalesEventDataById, { salesEventId });
  }

  async getToast(country, locale) {
    return await this.exec(GRAPHQL.queries.getToast, { country, locale });
  }

  async launcherQuery(namespace, offerId) {
    return await this.exec(GRAPHQL.queries.launcherQuery, { namespace, offerId });
  }

  async libraryQuery(cursor, excludeNs) {
    return await this.exec(GRAPHQL.queries.libraryQuery, { cursor, excludeNs });
  }

  async playtimeTrackingQuery(accountId) {
    return await this.exec(GRAPHQL.queries.playtimeTrackingQuery, { accountId });
  }

  async productReviewsQuery(sku) {
    return await this.exec(GRAPHQL.queries.productReviewsQuery, { sku });
  }

  async searchStoreQuery(allowCountries, category, count, country, keywords, locale, namespace, itemNs, sortBy, sortDir, start, tag, releaseDate, withPrice = false, withPromotions = false) {
    return await this.exec(GRAPHQL.queries.searchStoreQuery, { allowCountries, category, count, country, keywords, locale, namespace, itemNs, sortBy, sortDir, start, tag, releaseDate, withPrice, withPromotions });
  }

  async storefrontDiscover(layoutSlug, locale, country) {
    return await this.exec(GRAPHQL.queries.storefrontDiscover, { layoutSlug, locale, country });
  }

  async supportedTypesQuery(sandboxId) {
    return await this.exec(GRAPHQL.queries.supportedTypesQuery, { sandboxId });
  }

  /**
   * Returns redemption status of product code.
   * @param {string} codeId
   * @param {string} source
   */
  async redeemCodeMutation(codeId, source = 'DieselWebClient') {
    try {

      return await this.http.exec(GRAPHQL.mutations.redeemCodeMutation, { codeId, source });

    } catch (err) {

      this.debug.print(new Error(err));

    }
    return false;
  }

}

module.exports = GraphQL;
