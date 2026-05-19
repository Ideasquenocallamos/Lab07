import db from "../models/index.js";
const Libro = db.libro;
const Autor = db.autor;

const Op = db.Sequelize.Op;

const linkFields = [
  "link_lectura",
  "link_wattpad",
  "link_ao3",
  "link_fanfiction",
  "link_webnovel",
  "link_google_drive"
];

const isSupervisorRequest = (req) => req.userRole === "supervisor";

const disabledWhere = () => ({ estado_obra: { [Op.ne]: "inhabilitada" } });

const normalizeUrl = (value) => String(value || "").trim();

const checkSingleLink = async (field, value) => {
  const url = normalizeUrl(value);
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { field, url, ok: false, status: "URL_INVALIDA", message: "El enlace no tiene formato válido." };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { field, url, ok: false, status: "PROTOCOLO_INVALIDO", message: "Solo se permiten enlaces http o https." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if ([405, 403].includes(response.status)) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    if (response.status === 404) return { field, url, ok: false, status: 404, message: "Página no encontrada (404)." };
    if (response.status >= 400) return { field, url, ok: false, status: response.status, message: `El enlace respondió con error ${response.status}.` };
    return { field, url, ok: true, status: response.status, message: "Enlace verificado." };
  } catch (error) {
    return { field, url, ok: true, status: "NO_VERIFICADO", warning: true, message: `No se pudo comprobar en línea (${error.name === "AbortError" ? "tiempo agotado" : "conexión"}); se guardó como advertencia.` };
  } finally {
    clearTimeout(timer);
  }
};

const validateBookLinks = async (payload, { requireClean = true } = {}) => {
  const checks = (await Promise.all(linkFields.map((field) => checkSingleLink(field, payload[field])))).filter(Boolean);
  const errors = checks.filter((item) => !item.ok);
  if (requireClean && errors.length) {
    const detail = errors.map((item) => `${item.field}: ${item.message}`).join(" ");
    const error = new Error(`Corrige los enlaces antes de guardar. ${detail}`);
    error.status = 400;
    error.link_validation = checks;
    throw error;
  }
  return checks;
};

const appendSupervisorReport = (libro, report) => {
  const previous = libro.supervisor_report ? `${libro.supervisor_report}\n---\n` : "";
  libro.supervisor_report = `${previous}${new Date().toISOString()} | ${report}`;
};


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

const buildBookSearchWhere = (query, baseWhere = {}) => {
  const { q, genero, estado_obra, audiencia_objetivo, anio_publicacion } = query;
  const where = { ...baseWhere };
  const like = (value) => ({ [Op.like]: `%${String(value).trim()}%` });
  if (q?.trim()) {
    where[Op.or] = [
      { titulo: like(q) },
      { genero: like(q) },
      { etiquetas: like(q) },
      { audiencia_objetivo: like(q) }
    ];
  }
  if (genero?.trim()) where.genero = like(genero);
  if (estado_obra?.trim()) where.estado_obra = estado_obra;
  if (audiencia_objetivo?.trim()) where.audiencia_objetivo = like(audiencia_objetivo);
  if (/^\d{1,4}$/.test(String(anio_publicacion || "").trim())) where.anio_publicacion = Number(anio_publicacion);
  return where;
};

const searchMetadata = (query) => ({
  genero: query.genero || null,
  estado_obra: query.estado_obra || null,
  audiencia_objetivo: query.audiencia_objetivo || null,
  anio_publicacion: query.anio_publicacion || null
});

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
    const linkValidation = await validateBookLinks(payload);
    payload.link_validation_report = JSON.stringify(linkValidation);
    const libro = await Libro.create(payload);
    await trackBookEvent({ req, id_libro: libro.id_libro, event_type: "validacion_enlace", source: "crear_libro", metadata: { linkValidation } });
    res.status(201).json({ libro, link_validation: linkValidation });
  } catch (error) { res.status(error.status || 500).json({ message: error.message, link_validation: error.link_validation }); }
};

export const getLibros = async (req, res) => {
  const { q, codigo_privado } = req.query;
  const where = buildBookSearchWhere(req.query, isSupervisorRequest(req) ? {} : disabledWhere());
  await trackBookEvent({ req, event_type: "busqueda", source: req.query.source || "app", query: q || "", metadata: searchMetadata(req.query) });
  const all = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  const visible = isSupervisorRequest(req) ? all : all.filter((l) => l.visibilidad === "publico" || (["privado", "borrador"].includes(l.visibilidad) && codigo_privado && [l.codigo_privado, l.beta_reader_code].includes(codigo_privado)));
  res.json(visible);
};

export const getLibro = async (req, res) => {
  const { codigo_privado } = req.query;
  const libro = await Libro.findByPk(req.params.id, { include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
  if (libro.estado_obra === "inhabilitada" && !isSupervisorRequest(req)) return res.status(410).json({ message: "Libro inhabilitado por supervisión", motivo: libro.suspension_reason });
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
  try {
    const payload = { ...req.body };
    if (["privado", "borrador"].includes(payload.visibilidad) && !payload.codigo_privado) payload.codigo_privado = `${payload.visibilidad === "borrador" ? "BETA" : "PRIV"}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (payload.visibilidad === "borrador" && !payload.beta_reader_code) payload.beta_reader_code = payload.codigo_privado;
    const linkValidation = await validateBookLinks(payload);
    if (linkValidation.length) payload.link_validation_report = JSON.stringify(linkValidation);
    const [updated] = await Libro.update(payload, { where: { id_libro: req.params.id } });
    if (!updated) return res.status(404).json({ message: "Libro no encontrado" });
    res.json({ message: "Libro actualizado", link_validation: linkValidation });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message, link_validation: error.link_validation });
  }
};

export const deleteLibro = async (req, res) => {
  const deleted = await Libro.destroy({ where: { id_libro: req.params.id } });
  if (!deleted) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ message: "Libro eliminado" });
};



export const validateLibroLinks = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
    const linkValidation = await validateBookLinks(libro.toJSON(), { requireClean: false });
    libro.link_validation_report = JSON.stringify(linkValidation);
    await libro.save();
    await trackBookEvent({ req, id_libro: libro.id_libro, event_type: "validacion_enlace", source: "supervisor", metadata: { linkValidation } });
    res.json({ message: "Validación finalizada", link_validation: linkValidation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const supervisorReportLibro = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
    const action = req.body.action || "inhabilitar";
    const actionMode = req.body.action_mode === "prueba" ? "prueba" : "real";
    const motivo = String(req.body.motivo || req.body.reporte || "Caso revisado por supervisor.").trim();
    const linkValidation = await validateBookLinks(libro.toJSON(), { requireClean: false });
    if (actionMode === "real" && action === "inhabilitar") {
      libro.estado_obra = "inhabilitada";
      libro.suspension_reason = motivo;
    } else if (actionMode === "real" && action === "reactivar") {
      libro.estado_obra = "en_revision";
      libro.suspension_reason = null;
    }
    libro.link_validation_report = JSON.stringify(linkValidation);
    appendSupervisorReport(libro, `${actionMode.toUpperCase()} | ${action.toUpperCase()}: ${motivo}`);
    await libro.save();
    await trackBookEvent({ req, id_libro: libro.id_libro, event_type: "informe_supervisor", source: "supervisor", metadata: { action, action_mode: actionMode, motivo, linkValidation } });
    res.json({ message: actionMode === "prueba" ? "Simulación registrada: no se alteró estado del libro, solo informe para IA." : action === "inhabilitar" ? "Libro suspendido/inhabilitado con informe de confianza." : "Libro reactivado en revisión.", libro, action_mode: actionMode, link_validation: linkValidation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const intelligentBookSearch = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) return res.status(400).json({ message: "Escribe una búsqueda inteligente." });
    await trackBookEvent({ req, event_type: "busqueda_ia", source: "ia", query: q });
    const libros = await Libro.findAll({ where: disabledWhere(), include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }], limit: 200 });
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = libros.map((libro) => {
      const data = `${libro.titulo} ${libro.genero || ""} ${libro.etiquetas || ""} ${libro.audiencia_objetivo || ""} ${libro.comentarios_resenas || ""} ${libro.supervisor_report || ""}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (data.includes(term) ? 1 : 0), 0) + (libro.comentarios_resenas ? 0.5 : 0);
      return { libro, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    res.json({
      pregunta: q,
      respuesta: scored.length ? "La IA encontró coincidencias usando título, género, etiquetas, audiencia, reseñas e informes de supervisor." : "No encontré un libro activo con esos datos. Prueba género, etiqueta, audiencia o palabras de reseñas.",
      resultados: scored.map(({ libro, score }) => ({ id: libro.id_libro, titulo: libro.titulo, score, genero: libro.genero, etiquetas: libro.etiquetas, reseñas: libro.comentarios_resenas, informe_supervisor: libro.supervisor_report, autor: libro.autore?.nombre_autor }))
    });
  } catch {
    res.status(503).json({ message: "La búsqueda IA necesita conexión a la base de datos para leer libros, reseñas e informes." });
  }
};


export const supervisorDeleteLibro = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
    const motivo = String(req.body.motivo || "El supervisor eliminó el libro por revisión manual.").trim();
    await trackBookEvent({ req, id_libro: libro.id_libro, event_type: "informe_supervisor", source: "supervisor_delete", metadata: { motivo, titulo: libro.titulo } });
    await libro.destroy();
    res.json({ message: "Libro eliminado por supervisor", motivo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const supervisorReviewQueue = async (req, res) => {
  try {
    const libros = await Libro.findAll({ include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }], limit: 200, order: [["id_libro", "DESC"]] });
    const inferIssue = (libro) => {
      const issues = [];
      const report = String(libro.link_validation_report || "").toLowerCase();
      if (libro.estado_obra === "inhabilitada") issues.push("inhabilitada");
      if (report.includes("404") || report.includes("url_invalida") || report.includes("protocolo_invalido")) issues.push("enlace_roto");
      if (!libro.titulo || !libro.derechos) issues.push("metadatos_incompletos");
      if ((libro.comentarios_resenas || "").toLowerCase().includes("alerta")) issues.push("alerta_resena");
      if (issues.length === 0) issues.push("revision_oculta_sugerida");
      return issues;
    };
    const queue = libros.map((libro) => ({
      id_libro: libro.id_libro,
      titulo: libro.titulo,
      autor: libro.autore?.nombre_autor,
      estado_obra: libro.estado_obra,
      visibilidad: libro.visibilidad,
      motivos_revision: inferIssue(libro),
      suspension_reason: libro.suspension_reason,
      supervisor_report: libro.supervisor_report,
      link_validation_report: libro.link_validation_report
    }));
    res.json({ message: "Cola de revisión supervisor (explícita e implícita)", total: queue.length, queue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLibrosPublicos = async (req, res) => {
  const { q } = req.query;
  const where = buildBookSearchWhere(req.query, { visibilidad: "publico", ...disabledWhere() });
  await trackBookEvent({ req, event_type: "busqueda", source: req.query.source || "publico", query: q || "", metadata: searchMetadata(req.query) });
  const libros = await Libro.findAll({ where, include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  res.json(libros);
};
