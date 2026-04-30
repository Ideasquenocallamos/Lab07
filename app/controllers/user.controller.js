export const allAccess = (req, res) => {
  res.status(200).json({ message: "Contenido publico" });
};

export const userBoard = (req, res) => {
  res.status(200).json({ message: "Contenido para usuarios" });
};

export const moderatorBoard = (req, res) => {
  res.status(200).json({ message: "Contenido para moderadores" });
};

export const adminBoard = (req, res) => {
  res.status(200).json({ message: "Contenido para administradores" });
};
