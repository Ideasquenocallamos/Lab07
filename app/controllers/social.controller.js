import db from "../models/index.js";

export const joinComunidad = async (req, res) => {
  const comunidad = await db.comunidad.findByPk(req.body.id_comunidad);
  if (!comunidad) return res.status(404).json({ message: 'Comunidad no encontrada' });
  if (comunidad.tipo === 'privada' && comunidad.enlace_invitacion !== req.body.codigo) return res.status(403).json({ message: 'Código inválido' });
  const existing = await db.member.findOne({ where: { id_comunidad: comunidad.id_comunidad, user_id: req.userId } });
  if (existing?.status === 'bloqueado') return res.status(403).json({ message: 'Tu cuenta está bloqueada en esta comunidad' });
  if (existing?.status === 'restringido') return res.status(403).json({ message: 'Tu cuenta está restringida temporalmente en esta comunidad' });
  const [member, created] = await db.member.findOrCreate({ where: { id_comunidad: comunidad.id_comunidad, user_id: req.userId }, defaults: { id_comunidad: comunidad.id_comunidad, user_id: req.userId } });
  if (created) await comunidad.increment('numero_integrantes');
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


const assertCommunityAdmin = async (userId, idComunidad) => {
  const comunidad = await db.comunidad.findByPk(idComunidad);
  if (!comunidad) return { error: { status: 404, message: 'Comunidad no encontrada' } };
  const autor = await db.autor.findOne({ where: { user_id: userId } });
  if (autor && comunidad.id_autor === autor.id_autor) return { comunidad, autor };
  return { error: { status: 403, message: 'Solo el autor dueño de la comunidad puede administrar miembros' } };
};

export const moderateMember = async (req, res) => {
  const { id_comunidad, user_id, status = 'bloqueado', moderation_note } = req.body;
  if (!['activo', 'bloqueado', 'restringido'].includes(status)) return res.status(400).json({ message: 'Estado inválido' });
  const check = await assertCommunityAdmin(req.userId, id_comunidad);
  if (check.error) return res.status(check.error.status).json({ message: check.error.message });
  const [member] = await db.member.findOrCreate({
    where: { id_comunidad, user_id },
    defaults: { id_comunidad, user_id, status, moderation_note }
  });
  member.status = status;
  member.moderation_note = moderation_note || null;
  await member.save();
  res.json({ message: `Miembro ${status}`, member });
};

export const getCommunityAnalytics = async (req, res) => {
  const check = await assertCommunityAdmin(req.userId, req.params.idComunidad);
  if (check.error) return res.status(check.error.status).json({ message: check.error.message });
  const members = await db.member.findAll({ where: { id_comunidad: req.params.idComunidad }, include: [{ model: db.user, attributes: ['id', 'nombre', 'email', 'rol', 'is_premium', 'incognito_mode'] }] });
  const memberIds = members.map((m) => m.user_id);
  const posts = await db.post.findAll({ where: memberIds.length ? { user_id: memberIds } : { user_id: -1 }, limit: 200, order: [['id_post', 'DESC']] });
  const events = await db.bookEvent.findAll({ limit: 500, order: [['id_event', 'DESC']] });

  const byEvent = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {});
  const topSearches = Object.entries(events.filter(e => e.query).reduce((acc, event) => {
    acc[event.query] = (acc[event.query] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([query, count]) => ({ query, count }));

  res.json({
    comunidad: check.comunidad,
    resumen: {
      miembros: members.length,
      activos: members.filter(m => m.status === 'activo').length,
      restringidos: members.filter(m => m.status === 'restringido').length,
      bloqueados: members.filter(m => m.status === 'bloqueado').length,
      publicaciones: posts.length,
      eventos_libros: events.length
    },
    grafica: { eventos_por_tipo: byEvent, busquedas_top: topSearches },
    miembros: members.map(m => ({ id_member: m.id_member, status: m.status, moderation_note: m.moderation_note, usuario: m.user })),
    publicaciones_recientes: posts.slice(0, 20)
  });
};
