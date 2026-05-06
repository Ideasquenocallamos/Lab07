export const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => !req.body[field]);
  if (missing.length) {
    return res.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(", ")}` });
  }
  next();
};
