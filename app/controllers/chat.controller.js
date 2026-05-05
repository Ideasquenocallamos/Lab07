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
