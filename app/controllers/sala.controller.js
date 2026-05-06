import db from "../models/index.js";
const Sala = db.sala;

export const createSala = async (req, res) => {
  try { res.status(201).json(await Sala.create(req.body)); } catch (e) { res.status(500).json({ message: e.message }); }
};
export const getSalasByComunidad = async (req, res) => res.json(await Sala.findAll({ where: { id_comunidad: req.params.idComunidad } }));
export const deleteSala = async (req, res) => { const d = await Sala.destroy({ where: { id_sala: req.params.id } }); if (!d) return res.status(404).json({ message: 'No encontrada' }); res.json({ message: 'Sala eliminada' }); };
