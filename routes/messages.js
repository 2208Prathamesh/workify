const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User    = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

router.use(requireAuth);

// GET /api/messages — inbox (unique conversation threads)
router.get('/', async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.session.user.id);

    // Aggregate: group by partner, get last message + unread count
    const threads = await Message.aggregate([
      { $match: { $or: [{ from_id: me }, { to_id: me }] } },
      { $sort:  { created_at: -1 } },
      {
        $group: {
          _id:          { $cond: [{ $eq: ['$from_id', me] }, '$to_id', '$from_id'] },
          last_message: { $first: '$content' },
          last_at:      { $first: '$created_at' },
          last_from:    { $first: '$from_id' },
        },
      },
      { $sort: { last_at: -1 } },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'partner',
        },
      },
      { $unwind: '$partner' },
      {
        $lookup: {
          from: 'messages',
          let:  { partnerId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [
              { $eq: ['$from_id', '$$partnerId'] },
              { $eq: ['$to_id', me] },
              { $eq: ['$is_read', false] },
            ] } } },
            { $count: 'n' },
          ],
          as: 'unreadArr',
        },
      },
      {
        $project: {
          partner_id:     '$partner._id',
          partner_name:   '$partner.name',
          partner_avatar: '$partner.avatar_url',
          partner_role:   '$partner.role',
          last_message:   1,
          last_at:        1,
          last_from:      1,
          unread_count:   { $ifNull: [{ $arrayElemAt: ['$unreadArr.n', 0] }, 0] },
        },
      },
    ]);

    const totalUnread = await Message.countDocuments({ to_id: me, is_read: false });

    const out = threads.map(t => ({
      ...t,
      partner_id: t.partner_id.toString(),
    }));

    res.json({ threads: out, totalUnread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/thread/:partnerId — full conversation
router.get('/thread/:partnerId', async (req, res) => {
  try {
    const me      = new mongoose.Types.ObjectId(req.session.user.id);
    const partner = new mongoose.Types.ObjectId(req.params.partnerId);

    const messages = await Message.find({
      $or: [
        { from_id: me,      to_id: partner },
        { from_id: partner, to_id: me      },
      ],
    })
      .populate('job_id', 'title')
      .sort({ created_at: 1 })
      .lean();

    // Mark incoming as read
    await Message.updateMany({ from_id: partner, to_id: me, is_read: false }, { is_read: true });

    const partnerUser = await User.findById(partner).select('id name avatar_url role').lean();

    const out = messages.map(m => ({
      ...m,
      id:       m._id.toString(),
      from_id:  m.from_id.toString(),
      to_id:    m.to_id.toString(),
      job_title: m.job_id?.title || null,
    }));

    res.json({ messages: out, partner: partnerUser ? { ...partnerUser, id: partnerUser._id.toString() } : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages — send a message
router.post('/', async (req, res) => {
  try {
    const { to_id, content, job_id } = req.body;
    const from_id = req.session.user.id;

    if (!to_id || !content?.trim())
      return res.status(400).json({ error: 'Recipient and content required' });
    if (to_id === from_id)
      return res.status(400).json({ error: 'Cannot message yourself' });

    const recipient = await User.findById(to_id).select('_id');
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const msg = await Message.create({
      from_id, to_id,
      job_id:  job_id || null,
      content: content.trim(),
    });

    res.json({ ok: true, message: { ...msg.toObject(), id: msg._id.toString() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/unread — unread count (badge)
router.get('/unread', async (req, res) => {
  try {
    const count = await Message.countDocuments({ to_id: req.session.user.id, is_read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
