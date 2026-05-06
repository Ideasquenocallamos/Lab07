import db from "../models/index.js";

export const joinComunidad = async (req, res) => {
  const comunidad = await db.comunidad.findByPk(req.body.id_comunidad);
  if (!comunidad) return res.status(404).json({ message: 'Comunidad no encontrada' });
  if (comunidad.tipo === 'privada' && comunidad.enlace_invitacion !== req.body.codigo) return res.status(403).json({ message: 'Código inválido' });
  const [member] = await db.member.findOrCreate({ where: { id_comunidad: comunidad.id_comunidad, user_id: req.userId }, defaults: { id_comunidad: comunidad.id_comunidad, user_id: req.userId } });
  res.json(member);
};

export const sendSalaMessage = async (req, res) => {
  const msg = await db.salaMessage.create({ id_sala: req.body.id_sala, user_id: req.userId, contenido: req.body.contenido });
  const sala = await db.sala.findByPk(req.body.id_sala);
  if (sala) {
    const members = await db.member.findAll({ where: { id_comunidad: sala.id_comunidad } });
    await Promise.all(members.filter(m=>m.user_id!==req.userId).map(m => db.notification.create({ user_id: m.user_id, titulo: 'Nuevo mensaje en sala', detalle: `Sala ${sala.nombre_sala}` })));
  }
  res.status(201).json(msg);
};

export const getSalaMessages = async (req, res) => res.json(await db.salaMessage.findAll({ where: { id_sala: req.params.idSala }, order: [["id_msg", "ASC"]] }));

export const createPost = async (req, res) => {
  const me = await db.user.findByPk(req.userId);
  const post = await db.post.create({ user_id: req.userId, texto: req.body.texto, etiquetas: req.body.etiquetas });
  if (!me?.incognito_mode) {
    const users = await db.user.findAll({ attributes: ['id'] });
    await Promise.all(users.filter(u=>u.id!==req.userId).map(u=>db.notification.create({ user_id: u.id, titulo: 'Nueva promoción de autor', detalle: req.body.texto.slice(0,80) })));
  }
  res.status(201).json(post);
};

export const getFeed = async (req, res) => res.json(await db.post.findAll({ order: [["id_post", "DESC"]], limit: 100 }));

export const getNotifications = async (req, res) => res.json(await db.notification.findAll({ where: { user_id: req.userId }, order: [["id_notification", "DESC"]], limit: 100 }));
