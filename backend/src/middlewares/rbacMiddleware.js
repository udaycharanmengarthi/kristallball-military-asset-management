const { ApiError } = require("../utils/apiHelpers");

/**
 * Restricts a route to a set of allowed roles.
 * Usage: authorizeRoles("ADMIN", "LOGISTICS_OFFICER")
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    return next();
  };
}

/**
 * Forces base scoping for BASE_COMMANDER users.
 *
 * A BASE_COMMANDER must never be able to view or mutate another base's
 * data, even if they supply a different baseId in the query string or
 * request body.
 *
 * - ADMIN and LOGISTICS_OFFICER: unrestricted / not tied to a single base.
 *   Logistics Officers operate across bases (purchases, transfers) per the
 *   spec, so they are NOT forced through the single-base path here; their
 *   more granular restrictions (e.g. read-only on assignments/expenditures)
 *   are enforced separately via authorizeRoles on those routes.
 * - BASE_COMMANDER: req.user.baseId always overrides any client-supplied
 *   baseId in the body (see resolveBaseId for the query-string equivalent).
 *
 * This does not decide "is this operation allowed" (authorizeRoles does
 * that) - it only decides "which base does this request apply to", and it
 * never trusts the client for that decision.
 */
function enforceBaseScope(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role !== "BASE_COMMANDER") {
    // ADMIN and LOGISTICS_OFFICER pass through untouched.
    return next();
  }

  if (!req.user.baseId) {
    return next(new ApiError(403, "User is not assigned to a base"));
  }

  // IMPORTANT: in Express 5, req.query is a read-only getter derived from
  // the URL - assigning to req.query.baseId silently no-ops and the
  // original client-supplied value survives untouched. Do NOT attempt to
  // "sanitize" req.query here. Instead, every controller MUST resolve the
  // effective baseId via resolveBaseId(req) rather than ever reading
  // req.query.baseId itself for a Base Commander.
  //
  // req.body IS a plain writable object (populated by express.json()), so
  // overriding it there is safe and still done for mutation routes.
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "baseId")) {
    req.body.baseId = req.user.baseId;
  }

  req.scopedBaseId = req.user.baseId;

  return next();
}

/**
 * The single source of truth for "which base does this GET/list request
 * apply to". A BASE_COMMANDER always gets their own baseId, no matter what
 * (if anything) is in the query string. ADMIN and LOGISTICS_OFFICER get
 * whatever they asked for, or undefined ("no filter / all bases") if they
 * didn't specify one.
 */
function resolveBaseId(req) {
  if (req.user.role === "BASE_COMMANDER") {
    return req.user.baseId;
  }
  return req.query.baseId ? Number(req.query.baseId) : undefined;
}

/**
 * For routes involving a transfer (source + destination base), a
 * BASE_COMMANDER may only act when their own base is the source. This is
 * intentionally explicit rather than reusing enforceBaseScope, since a
 * transfer touches two bases at once.
 */
function enforceTransferBaseScope(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role === "ADMIN" || req.user.role === "LOGISTICS_OFFICER") {
    return next();
  }

  if (req.user.role === "BASE_COMMANDER") {
    const sourceBaseId = req.body?.sourceBaseId;
    if (Number(sourceBaseId) !== Number(req.user.baseId)) {
      return next(
        new ApiError(403, "Base Commanders may only initiate transfers from their own base")
      );
    }
    return next();
  }

  return next(new ApiError(403, "You do not have permission to perform this action"));
}

module.exports = { authorizeRoles, enforceBaseScope, enforceTransferBaseScope, resolveBaseId };
