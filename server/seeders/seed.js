import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
}

const users = [
  {
    name: 'Super Admin',
    email: 'admin@bikrans.com',
    phone: '01700000001',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Manager One',
    email: 'manager@bikrans.com',
    phone: '01700000002',
    password: 'manager123',
    role: 'manager',
  },
  {
    name: 'Test User',
    email: 'user@bikrans.com',
    phone: '01700000003',
    password: 'user123',
    role: 'user',
  },
  {
    name: 'প্রেজেন্টেশন ম্যানেজার',
    email: 'presentation@bikrans.com',
    phone: '01700000004',
    password: 'presentation123',
    role: 'presentation_manager',
  },
]

async function seed() {
  const conn = await mysql.createConnection(config)
  try {
    const dbName = process.env.DB_NAME || 'bikrans_db'
    await conn.query(`USE \`${dbName}\``)

    for (const u of users) {
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email])
      if (existing.length > 0) {
        console.log(`User ${u.email} already exists, skipping.`)
        continue
      }
      const hashed = await bcrypt.hash(u.password, 10)
      await conn.query(
        'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, u.phone, hashed, u.role]
      )
      console.log(`Created: ${u.email} (${u.role})`)
    }

    const sliders = [
      { image: '/banner1.png', title: 'প্রাকৃতিক স্বাস্থ্য সমাধান', subtitle: 'বিক্রান্সের সাথে সুস্থ জীবন', sort_order: 0 },
      { image: '/banner2.png', title: 'Z-DIA ডায়াবেটিস সাপোর্ট', subtitle: 'প্রাকৃতিক উপাদানে তৈরি', sort_order: 1 },
      { image: '/banner3.png', title: 'ক্যারিয়ার গড়ুন বিক্রান্সে', subtitle: 'আয়ের নতুন সুযোগ', sort_order: 2 },
    ]

    const [sliderRows] = await conn.query('SELECT id FROM sliders LIMIT 1')
    if (sliderRows.length === 0) {
      for (const s of sliders) {
        await conn.query(
          'INSERT INTO sliders (image, title, subtitle, sort_order) VALUES (?, ?, ?, ?)',
          [s.image, s.title, s.subtitle, s.sort_order]
        )
      }
      console.log('Created: 3 default sliders')
    }

    // Seed header settings
    const [headerRows] = await conn.query('SELECT id FROM header_settings LIMIT 1')
    if (headerRows.length === 0) {
      await conn.query(`
        INSERT INTO header_settings 
        (logo_image, logo_height, header_height, header_bg_color, show_search_btn, app_btn_text, app_btn_link, app_btn_bg_color, show_menu_btn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ['/BIKRANS-FINAL.png', 36, 56, '#ffffff', 1, 'বিক্রান্স অ্যাপ', '', '#52B788', 1])
      console.log('Created: Default header settings')
    }

    // Seed footer nav items
    const [footerRows] = await conn.query('SELECT id FROM footer_nav_items LIMIT 1')
    if (footerRows.length === 0) {
      const footerItems = [
        { icon: '🏠', label: 'হোম', link: '/', sort_order: 0 },
        { icon: '🛍️', label: 'পণ্য', link: '#', sort_order: 1 },
        { icon: '💼', label: 'ক্যারিয়ার', link: '#', sort_order: 2 },
        { icon: '👤', label: 'প্রোফাইল', link: '/login', sort_order: 3 },
      ]
      for (const item of footerItems) {
        await conn.query(
          'INSERT INTO footer_nav_items (icon, label, link, sort_order) VALUES (?, ?, ?, ?)',
          [item.icon, item.label, item.link, item.sort_order]
        )
      }
      console.log('Created: 4 default footer nav items')
    }

    // Seed landing page (services, features, CTA)
    const [landingServicesSettingsRows] = await conn.query('SELECT id FROM landing_services_settings LIMIT 1')
    if (landingServicesSettingsRows.length === 0) {
      await conn.query(
        'INSERT INTO landing_services_settings (section_title) VALUES (?)',
        ['সব স্বাস্থ্য সমাধান এক প্ল্যাটফর্মে']
      )
      const servicesItems = [
        { icon: '/zdia.png', title: 'Z-DIA', link_text: 'বিস্তারিত জানুন', link_url: '#', is_image: 1, sort_order: 0 },
        { icon: '/vita-force.png', title: 'Vita Force', link_text: 'বিস্তারিত জানুন', link_url: '#', is_image: 1, sort_order: 1 },
        { icon: '💼', title: 'ক্যারিয়ার', link_text: 'বিস্তারিত জানুন', link_url: '#', is_image: 0, sort_order: 2 },
        { icon: '🎯', title: 'ডিস্ট্রিবিউটর', link_text: 'বিস্তারিত জানুন', link_url: '#', is_image: 0, sort_order: 3 },
      ]
      for (const s of servicesItems) {
        await conn.query(
          'INSERT INTO landing_services (icon, title, link_text, link_url, is_image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [s.icon, s.title, s.link_text, s.link_url, s.is_image, s.sort_order]
        )
      }
      console.log('Created: Landing services section with 4 items')
    }

    const [landingFeaturesSettingsRows] = await conn.query('SELECT id FROM landing_features_settings LIMIT 1')
    if (landingFeaturesSettingsRows.length === 0) {
      await conn.query(
        'INSERT INTO landing_features_settings (section_title) VALUES (?)',
        ['কেন বিক্রান্স বেছে নেবেন?']
      )
      const featuresItems = [
        { icon: '🏆', title: 'মানসম্মত পণ্য', description: 'প্রাকৃতিক উপাদানে তৈরি', sort_order: 0 },
        { icon: '🚀', title: 'দ্রুত ডেলিভারি', description: 'সারাদেশে ডেলিভারি', sort_order: 1 },
        { icon: '💰', title: 'আয়ের সুযোগ', description: 'ডিস্ট্রিবিউটর হিসেবে আয়', sort_order: 2 },
        { icon: '🤝', title: 'সার্বক্ষণিক সাপোর্ট', description: '২৪/৭ গ্রাহক সেবা', sort_order: 3 },
      ]
      for (const f of featuresItems) {
        await conn.query(
          'INSERT INTO landing_features (icon, title, description, sort_order) VALUES (?, ?, ?, ?)',
          [f.icon, f.title, f.description, f.sort_order]
        )
      }
      console.log('Created: Landing features section with 4 items')
    }

    const [landingCtaRows] = await conn.query('SELECT id FROM landing_cta LIMIT 1')
    if (landingCtaRows.length === 0) {
      await conn.query(
        `INSERT INTO landing_cta (heading, subtitle, primary_btn_text, primary_btn_link, secondary_btn_text, secondary_btn_link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['আজই শুরু করুন', 'স্বাস্থ্য ও আয়ের নতুন যাত্রা', '📞 কল করুন', '+8801700000000', '💬 WhatsApp', '8801700000000']
      )
      console.log('Created: Landing CTA section')
    }

    // Seed default project FTMP
    const [projectRows] = await conn.query("SELECT id FROM projects WHERE code = 'FTMP' LIMIT 1")
    if (projectRows.length === 0) {
      await conn.query(
        'INSERT INTO projects (code, name) VALUES (?, ?)',
        ['FTMP', 'পায়রা প্রোডাকশন টিকটক চ্যালেঞ্জ']
      )
      console.log('Created: Default project FTMP')
    }

    // Seed tasks (need admin as created_by, user as assigned)
    const [taskRows] = await conn.query('SELECT id FROM tasks LIMIT 1')
    if (taskRows.length === 0) {
      const [[adminRow]] = await conn.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'])
      const [[userRow]] = await conn.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['user'])
      const adminId = adminRow?.id
      const userId = userRow?.id
      if (adminId && userId) {
        const tasks = [
          { title: 'TikTok ভিডিও পোস্ট করুন', description: 'প্রোডাক্ট প্রমোশন ভিডিও তৈরি ও পোস্ট করুন', type: 'tiktok_video', status: 'pending', priority: 'high' },
          { title: 'ফেসবুক পেজ মডারেশন', description: 'কমেন্ট ও পোস্ট রিভিউ করুন', type: 'facebook_moderator', status: 'in_progress', priority: 'medium' },
          { title: 'সাপ্তাহিক টিকটক কন্টেন্ট', description: '৩টি শর্ট ভিডিও আপলোড করুন', type: 'tiktok_video', status: 'pending', priority: 'medium' },
        ]
        for (const t of tasks) {
          await conn.query(
            `INSERT INTO tasks (title, description, type, status, assigned_user_id, created_by, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [t.title, t.description, t.type, t.status, userId, adminId, t.priority]
          )
        }
        console.log('Created: 3 seed tasks')
      } else {
        console.log('Skipping tasks seed: need admin and user in users table.')
      }
    }

    console.log('Seeding complete.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await conn.end()
  }
}

seed()
