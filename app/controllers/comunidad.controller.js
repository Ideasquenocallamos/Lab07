import db from "../models/index.js";
const Comunidad = db.comunidad;

const resolveAutorId = async (userId, requestedAutorId) => {
  if (requestedAutorId) return requestedAutorId;
  const autor = await db.autor.findOne({ where: { user_id: userId } });
  if (autor) return autor.id_autor;
  const user = await db.user.findByPk(userId);
  const [created] = await db.autor.findOrCreate({
    where: { user_id: userId },
    defaults: {
      nombre_autor: user?.nombre || "Autor BookSocial",
      pais_origen: "No especificado",
      fecha_nacimiento: "1900-01-01",
      user_id: userId
    }
  });
  return created.id_autor;
};

export const createComunidad = async (req, res) => {
  try {
    const payload = { ...req.body, id_autor: await resolveAutorId(req.userId, req.body.id_autor) };
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
