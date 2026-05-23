
content = open('routes/admin.js', 'r', encoding='utf-8').read()

new_routes = '''
const Settings = require('../models/Settings');

router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) settings = await Settings.create({ key: 'global' });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/settings', protect, requireAdmin, async (req, res) => {
  try {
    const { theme, branding, hero, siteedits, effects } = req.body;
    const update = { updatedAt: new Date() };
    if (theme !== undefined) update.theme = theme;
    if (branding !== undefined) update.branding = branding;
    if (hero !== undefined) update.hero = hero;
    if (siteedits !== undefined) update.siteedits = siteedits;
    if (effects !== undefined) update.effects = effects;
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { ['']: update },
      { upsert: true, new: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
'''

result = content.replace("module.exports = router;", new_routes + "\nmodule.exports = router;")
open('routes/admin.js', 'w', encoding='utf-8').write(result)
print('Done!')
