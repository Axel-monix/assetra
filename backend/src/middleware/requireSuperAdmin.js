function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Fitur ini khusus super admin.",
    });
  }
  next();
}
 
module.exports = { requireSuperAdmin };
 