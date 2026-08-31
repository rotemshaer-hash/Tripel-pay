/**
 * Is this failure a switch the business has not turned on, rather than the worker's
 * reception?
 *
 * The worker's page has exactly one chance to say something useful. Telling someone
 * standing on a roof to "check your connection" when the real cause is a setting in
 * the manager's Firebase console sends them to fiddle with a phone that is working
 * fine, and the manager never hears that anything is wrong.
 *
 * Anonymous sign-in is refused with two different codes, and which one arrives depends
 * on the project rather than on the fault: a plain Firebase project reports
 * `operation-not-allowed`, while a project on Identity Platform reports
 * `admin-restricted-operation` for the very same disabled provider. Knowing only the
 * first one is how a disabled provider spent an evening looking like a network
 * problem, so both live here, in one definition that every screen reads.
 */
const NOT_ENABLED_CODES: readonly string[] = ["auth/operation-not-allowed", "auth/admin-restricted-operation"];

export function isServiceNotEnabled(code: string, message = ""): boolean {
  return NOT_ENABLED_CODES.includes(code) || /permission|denied/i.test(`${code} ${message}`);
}
