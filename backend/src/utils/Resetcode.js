const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 menit
const resetCodes = new Map();

function setCode(email, code) {
  resetCodes.set(email, {
    code,
    expiresAt: Date.now() + CODE_EXPIRY_MS,
    verified: false,
  });
}

function getEntry(email) {
  return resetCodes.get(email);
}

function markVerified(email) {
  const entry = resetCodes.get(email);
  if (entry) {
    entry.verified = true;
    resetCodes.set(email, entry);
  }
}

function deleteEntry(email) {
  resetCodes.delete(email);
}

function isExpired(entry) {
  return !entry || entry.expiresAt < Date.now();
}

setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of resetCodes.entries()) {
    if (entry.expiresAt < now) {
      resetCodes.delete(email);
    }
  }
}, 60 * 1000);

module.exports = {
  setCode,
  getEntry,
  markVerified,
  deleteEntry,
  isExpired,
};
