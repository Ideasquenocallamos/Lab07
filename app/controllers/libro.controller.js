import db from "../models/index.js";
const Libro = db.libro;
const Autor = db.autor;

async function resolveAutorId(userId, requestedAutorId) {
  if (requestedAutorId) return requestedAutorId;
  const myAutor = await Autor.findOne({ where: { user_id: userId } });
  if (myAutor) return myAutor.id_autor;
  const [anon] = await Autor.findOrCreate({ where: { nombre_autor: "Anónimo" }, defaults: { pais_origen: "Desconocido", fecha_nacimiento: "1900-01-01", user_id: null } });
  return anon.id_autor;
}

export const createLibro = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.id_autor = await resolveAutorId(req.userId, payload.id_autor);
    if (payload.visibilidad === "privado" && !payload.codigo_privado) {
      payload.codigo_privado = `PRIV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    const libro = await Libro.create(payload);
    res.status(201).json(libro);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getLibros = async (req, res) => {
  const { q, codigo_privado } = req.query;
  const where = {};
  if (q) where.titulo = { [db.Sequelize.Op.like]: `%${q}%` };
  const all = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  const visible = all.filter((l) => l.visibilidad === "publico" || (l.visibilidad === "privado" && codigo_privado && l.codigo_privado === codigo_privado));
  res.json(visible);
};

export const getLibro = async (req, res) => {
  const { codigo_privado } = req.query;
  const libro = await Libro.findByPk(req.params.id, { include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
  if (libro.visibilidad === "privado" && libro.codigo_privado !== codigo_privado) return res.status(403).json({ message: "Código privado requerido" });
  if (libro.visibilidad === "borrador") return res.status(403).json({ message: "Borrador no visible públicamente" });
  res.json(libro);
};

export const updateLibro = async (req, res) => {
  const payload = { ...req.body };
  if (payload.visibilidad === "privado" && !payload.codigo_privado) payload.codigo_privado = `PRIV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [updated] = await Libro.update(payload, { where: { id_libro: req.params.id } });
  if (!updated) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ message: "Libro actualizado" });
};

export const deleteLibro = async (req, res) => {
  const deleted = await Libro.destroy({ where: { id_libro: req.params.id } });
  if (!deleted) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ message: "Libro eliminado" });
};


export const getLibrosPublicos = async (req, res) => {
  const { q } = req.query;
  const where = { visibilidad: "publico" };
  if (q) where.titulo = { [db.Sequelize.Op.like]: `%${q}%` };
  const libros = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  res.json(libros);
};
