import db from "../models/index.js";
const Libro = db.libro;
const Autor = db.autor;

const trackBookEvent = async ({ req, id_libro = null, event_type, source = null, query = null, metadata = null }) => {
  try {
    await db.bookEvent.create({
      user_id: req.userId || null,
      id_libro,
      event_type,
      source,
      query,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch {
    // La analítica no debe romper lectura/búsqueda de libros.
  }
};

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
    if (["privado", "borrador"].includes(payload.visibilidad) && !payload.codigo_privado) {
      payload.codigo_privado = `${payload.visibilidad === "borrador" ? "BETA" : "PRIV"}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    if (payload.visibilidad === "borrador" && !payload.beta_reader_code) payload.beta_reader_code = payload.codigo_privado;
    const libro = await Libro.create(payload);
    res.status(201).json(libro);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getLibros = async (req, res) => {
  const { q, codigo_privado } = req.query;
  const where = {};
  if (q) where.titulo = { [db.Sequelize.Op.like]: `%${q}%` };
  await trackBookEvent({ req, event_type: "busqueda", source: req.query.source || "app", query: q || "" });
  const all = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  const visible = all.filter((l) => l.visibilidad === "publico" || (["privado", "borrador"].includes(l.visibilidad) && codigo_privado && [l.codigo_privado, l.beta_reader_code].includes(codigo_privado)));
  res.json(visible);
};

export const getLibro = async (req, res) => {
  const { codigo_privado } = req.query;
  const libro = await Libro.findByPk(req.params.id, { include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
  if (libro.visibilidad === "privado" && libro.codigo_privado !== codigo_privado) return res.status(403).json({ message: "Código privado requerido" });
  if (libro.visibilidad === "borrador" && ![libro.codigo_privado, libro.beta_reader_code].includes(codigo_privado)) return res.status(403).json({ message: "Borrador solo visible para lector beta con código" });
  await trackBookEvent({ req, id_libro: libro.id_libro, event_type: req.query.event_type === "enlace" ? "enlace" : "vista", source: req.query.source || "detalle" });
  res.json(libro);
};

export const addLibroReview = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
    const text = String(req.body.texto || "").trim();
    if (!text) return res.status(400).json({ message: "La reseña o comentario es obligatorio" });
    const user = req.userId ? await db.user.findByPk(req.userId) : null;
    const previous = libro.comentarios_resenas ? `${libro.comentarios_resenas}\n---\n` : "";
    libro.comentarios_resenas = `${previous}${user?.nombre || "Lector"}: ${text}`;
    await libro.save();
    await trackBookEvent({ req, id_libro: libro.id_libro, event_type: "resena", source: "lector", metadata: { texto: text } });
    res.json({ message: "Reseña guardada", comentarios_resenas: libro.comentarios_resenas });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLibro = async (req, res) => {
  const payload = { ...req.body };
  if (["privado", "borrador"].includes(payload.visibilidad) && !payload.codigo_privado) payload.codigo_privado = `${payload.visibilidad === "borrador" ? "BETA" : "PRIV"}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  if (payload.visibilidad === "borrador" && !payload.beta_reader_code) payload.beta_reader_code = payload.codigo_privado;
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
  await trackBookEvent({ req, event_type: "busqueda", source: req.query.source || "publico", query: q || "" });
  const libros = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  res.json(libros);
};
