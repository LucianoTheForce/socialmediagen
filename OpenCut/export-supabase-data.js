/**
 * Export data from Supabase PostgreSQL for migration to Upstash
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Current Supabase connection from .env.local
const SUPABASE_CONNECTION = "postgresql://postgres.eaoysflxmcoooiyclcte:[Force838569!]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: SUPABASE_CONNECTION,
  ssl: { rejectUnauthorized: false }
});

async function exportTableData(tableName) {
  console.log(`📊 Exporting ${tableName}...`);
  
  try {
    const result = await client.query(`SELECT * FROM "${tableName}"`);
    
    if (result.rows.length === 0) {
      console.log(`   ℹ️  Table ${tableName} is empty`);
      return;
    }

    // Convert to CSV format
    const headers = Object.keys(result.rows[0]);
    const csvContent = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Save to file
    const fileName = `${tableName}_export.csv`;
    fs.writeFileSync(path.join(__dirname, 'migration-data', fileName), csvContent, 'utf8');
    
    console.log(`   ✅ Exported ${result.rows.length} records from ${tableName} to ${fileName}`);
    
  } catch (error) {
    console.error(`   ❌ Error exporting ${tableName}:`, error.message);
  }
}

async function exportSupabaseData() {
  console.log('🚀 Starting Supabase data export...\n');

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL\n');

    // Create migration-data directory
    const migrationDir = path.join(__dirname, 'migration-data');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    // Export all tables
    const tables = ['users', 'accounts', 'sessions', 'verifications', 'waitlist'];
    
    for (const table of tables) {
      await exportTableData(table);
    }

    console.log('\n🎯 Export completed successfully!');
    console.log('📁 Data files saved in migration-data/ directory');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await client.end();
  }
}

// Run export
exportSupabaseData();