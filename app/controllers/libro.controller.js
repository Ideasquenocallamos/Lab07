import db from "../models/index.js";
const Libro = db.libro;
const Autor = db.autor;

export const createLibro = async (req, res) => {
  try {
    const payload = { ...req.body };
    const libro = await Libro.create(payload);
    res.status(201).json(libro);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getLibros = async (req, res) => {
  const libros = await Libro.findAll({ include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  res.json(libros);
};

export const getLibro = async (req, res) => {
  const libro = await Libro.findByPk(req.params.id, { include: [{ model: Autor, attributes: ["id_autor", "nombre_autor"] }] });
  if (!libro) return res.status(404).json({ message: "Libro no encontrado" });
  res.json(libro);
};

export const updateLibro = async (req, res) => {
  const payload = { ...req.body };
  const [updated] = await Libro.update(payload, { where: { id_libro: req.params.id } });
  if (!updated) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ message: "Libro actualizado" });
};

export const deleteLibro = async (req, res) => {
  const deleted = await Libro.destroy({ where: { id_libro: req.params.id } });
  if (!deleted) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ message: "Libro eliminado" });
};
