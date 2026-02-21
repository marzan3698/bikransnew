export async function up(conn) {
  await conn.query(`
    ALTER TABLE admin_panel_settings
    ADD COLUMN virtual_seminar_timeline_id INT NULL
  `)
  await conn.query(`
    ALTER TABLE admin_panel_settings
    ADD CONSTRAINT fk_virtual_seminar_timeline
    FOREIGN KEY (virtual_seminar_timeline_id) REFERENCES timelines(id) ON DELETE SET NULL
  `)
}

export async function down(conn) {
  await conn.query(`
    ALTER TABLE admin_panel_settings DROP FOREIGN KEY fk_virtual_seminar_timeline
  `)
  await conn.query(`
    ALTER TABLE admin_panel_settings DROP COLUMN virtual_seminar_timeline_id
  `)
}
