const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Attachment } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
// Max 10MB per file, matching the "Max file size: 10MB" note in the raise-ticket mockup
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/attachments - upload a file, then link it with ownerType/ownerId
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { ownerType, ownerId } = req.body;
  if (!['event', 'ticket', 'message'].includes(ownerType) || !ownerId) {
    return res.status(400).json({ error: 'ownerType and ownerId are required' });
  }

  const attachment = await Attachment.create({
    ownerType,
    ownerId,
    fileName: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
  });

  res.status(201).json(attachment);
});

// GET /api/attachments?ownerType=&ownerId=
router.get('/', async (req, res) => {
  const { ownerType, ownerId } = req.query;
  const attachments = await Attachment.findAll({ where: { ownerType, ownerId } });
  res.json(attachments);
});

module.exports = router;
