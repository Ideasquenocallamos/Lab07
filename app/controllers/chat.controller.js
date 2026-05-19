import db from "../models/index.js";
const Chat = db.chat;

export const sendMessage = async (req, res) => {
  try {
    const chat = await Chat.create({ from_user_id: req.userId, to_user_id: req.body.to_user_id, mensaje: req.body.mensaje });
    res.status(201).json(chat);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getInbox = async (req, res) => {
  const msgs = await Chat.findAll({ where: { to_user_id: req.userId }, order: [["id_chat", "DESC"]], limit: 100 });
  res.json(msgs);
};

export const getConversation = async (req, res) => {
  const other = Number(req.params.userId);
  const msgs = await Chat.findAll({
    where: {
      [db.Sequelize.Op.or]: [
        { from_user_id: req.userId, to_user_id: other },
        { from_user_id: other, to_user_id: req.userId }
      ]
    },
    order: [["id_chat", "ASC"]]
  });
  res.json(msgs);
};


export const askAppAssistant = async (req, res) => {
  const q = String(req.body.pregunta || "").trim().toLowerCase();
  if (!q) return res.status(400).json({ message: "Escribe una pregunta" });
  const rules = [
    { keys: ["supervisor", "captcha"], answer: "El rol supervisor es oculto. Solo se activa con el correo autorizado y luego de captcha." },
    { keys: ["404", "enlace"], answer: "Cuando un enlace da 404, valida el libro y registra informe para inhabilitar o reactivar." },
    { keys: ["ia", "busqueda", "reseña"], answer: "La búsqueda IA considera título, etiquetas, género, audiencia, reseñas e informes." },
    { keys: ["gmail", "correo", "smtp"], answer: "Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS para enviar verificaciones por Gmail." }
  ];
  const hit = rules.find((r) => r.keys.some((k) => q.includes(k)));
  res.json({ pregunta: req.body.pregunta, respuesta: hit?.answer || "Puedo ayudarte con supervisor, enlaces 404, IA de libros y configuración Gmail SMTP." });
};
