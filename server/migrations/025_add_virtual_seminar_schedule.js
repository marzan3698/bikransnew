export async function up(conn) {
  await conn.query(`
    ALTER TABLE admin_panel_settings
    ADD COLUMN virtual_seminar_start_time DATETIME NULL
  `)
}

export async function down(conn) {
  await conn.query(`
    ALTER TABLE admin_panel_settings
    DROP COLUMN virtual_seminar_start_time
  `)
}
