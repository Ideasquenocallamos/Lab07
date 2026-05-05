import db from "../models/index.js";
const Comunidad = db.comunidad;

export const createComunidad = async (req, res) => {
  try {
    const payload = { ...req.body, id_autor: req.body.id_autor || req.userId };
    if (payload.tipo === "privada" && !payload.enlace_invitacion) payload.enlace_invitacion = `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const c = await Comunidad.create(payload);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getComunidades = async (req, res) => {
  const codigo = req.query.codigo;
  const list = await Comunidad.findAll();
  const visible = list.filter(c => c.tipo === "publica" || (c.tipo === "privada" && codigo && c.enlace_invitacion === codigo));
  res.json(visible);
};

export const updateComunidad = async (req, res) => {
  const [u] = await Comunidad.update(req.body, { where: { id_comunidad: req.params.id } });
  if (!u) return res.status(404).json({ message: "No encontrada" });
  res.json({ message: "Comunidad actualizada" });
};

export const deleteComunidad = async (req, res) => {
  const d = await Comunidad.destroy({ where: { id_comunidad: req.params.id } });
  if (!d) return res.status(404).json({ message: "No encontrada" });
  res.json({ message: "Comunidad eliminada" });
};
