import db from "../models/index.js";
const Autor = db.autor;

export const createAutor = async (req, res) => {
  try {
    const autor = await Autor.create({ ...req.body, user_id: req.userId });
    res.status(201).json(autor);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
export const getAutores = async (req, res) => res.json(await Autor.findAll());
export const getAutor = async (req, res) => {
  const autor = await Autor.findByPk(req.params.id);
  if (!autor) return res.status(404).json({ message: "Autor no encontrado" });
  res.json(autor);
};
export const updateAutor = async (req, res) => {
  const [updated] = await Autor.update(req.body, { where: { id_autor: req.params.id } });
  if (!updated) return res.status(404).json({ message: "Autor no encontrado" });
  res.json({ message: "Autor actualizado" });
};
export const deleteAutor = async (req, res) => {
  const deleted = await Autor.destroy({ where: { id_autor: req.params.id } });
  if (!deleted) return res.status(404).json({ message: "Autor no encontrado" });
  res.json({ message: "Autor eliminado" });
};
