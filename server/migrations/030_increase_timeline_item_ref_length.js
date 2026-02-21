export async function up(conn) {
  await conn.query(`
    ALTER TABLE timeline_frame_items
    MODIFY COLUMN item_ref VARCHAR(500) NOT NULL
  `)
}

export async function down(conn) {
  await conn.query(`
    ALTER TABLE timeline_frame_items
    MODIFY COLUMN item_ref VARCHAR(100) NOT NULL
  `)
}
