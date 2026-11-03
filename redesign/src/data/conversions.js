/**
 * Google Ads measurement.
 *
 * Two Google Ads accounts advertise this site: the original one, which is
 * already running campaigns, and a second one opened to run the Africa
 * search campaign on its own budget. A tag only reports into the account it
 * belongs to, so BOTH account ids have to be configured here — otherwise the
 * second account records nothing at all, conversions and remarketing alike.
 *
 * gtag supports any number of AW- destinations on one page; each simply gets
 * its own config call.
 */

export const googleAdsTags = [
  // Original account — the tag that has always been on the site.
  "AW-18158845729",
  // Second account (419-573-2162). Google Ads → Admin → the AW- id shown in
  // the Google tag instructions. Nothing in that account measures anything
  // until this is filled in.
  // "AW-XXXXXXXXXX",
];

/**
 * Conversion actions, each holding the full `send_to` values that Google Ads
 * prints in its tag snippet — "AW-<account>/<label>", copied verbatim.
 *
 * Full values rather than bare labels because there are two accounts: the
 * prefix is what decides which one is credited. List more than one value to
 * report the same action into both accounts; leave the array empty and the
 * action stays dormant, so this file is safe to deploy before the conversion
 * actions exist.
 *
 * Where to find them:
 *   Google Ads → Goals → Conversions → Summary → (the action)
 *   → Tag setup → Use Google tag → the snippet's `send_to` value.
 */
export const conversions = {
  /**
   * Quote form submitted. Fires once on /thank-you, which the form redirects
   * to only after /api/quote accepts the submission.
   *
   * Leave empty if the account measures this with a URL-based rule on
   * /thank-you instead — both at once would double-count it.
   */
  quoteRequest: [],

  /** Any tel: link clicked, anywhere on the site. */
  callClick: [],

  /** Any wa.me link clicked, anywhere on the site. */
  whatsappClick: [],
};
