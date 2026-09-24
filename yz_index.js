require('dotenv').config();
const express = require('express');
const db = require('./db');
const initDatabase = require('./init-db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Basic health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

const multer = require('multer');
const { XMLParser } = require('fast-xml-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const SftpClient = require('ssh2-sftp-client');
const upload = multer({ dest: 'uploads/' });

// Endpoint to retrieve compliance data from XML table
app.get('/api/compliance-xml', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM compliance_dataxml LIMIT 100');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search API across both Excel and XML tables
app.get('/api/search', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Please provide a name to search for' });
  }

  try {
    const searchTerm = `%${name}%`;

    // Search in the Excel table (compliance_data)
    // We check both 'name' and 'aliases' columns
    const excelQuery = `
      SELECT * FROM compliance_data 
      WHERE name ILIKE $1 OR aliases ILIKE $1
      LIMIT 100;
    `;
    const excelResult = await db.query(excelQuery, [searchTerm]);

    // Search in the XML table (compliance_dataxml)
    // We check 'names' and 'non_latin_names' columns
    const xmlQuery = `
      SELECT * FROM compliance_dataxml 
      WHERE names ILIKE $1 OR non_latin_names ILIKE $1
      LIMIT 100;
    `;
    const xmlResult = await db.query(xmlQuery, [searchTerm]);

    // Return combined results
    res.status(200).json({
      International_PEPs: excelResult.rows,
      UK_Sanctions_List: xmlResult.rows
    });

  } catch (err) {
    console.error('Error searching data:', err);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// XML Upload Endpoint
app.post('/api/upload-xml', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const xmlData = fs.readFileSync(req.file.path, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlData);

    let designations = [];
    if (result.Designations && result.Designations.Designation) {
      if (Array.isArray(result.Designations.Designation)) {
        designations = result.Designations.Designation;
      } else {
        designations = [result.Designations.Designation];
      }
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      for (const desig of designations) {
        const id = desig.UniqueID || null;
        if (!id) continue;

        const schema = desig.IndividualEntityShip || null;

        let primaryName = '';
        const aliases = [];
        if (desig.Names && desig.Names.Name) {
          const namesArray = Array.isArray(desig.Names.Name) ? desig.Names.Name : [desig.Names.Name];
          for (const n of namesArray) {
            if (n.NameType === 'Primary Name') {
              primaryName = n.Name6 || n.Name1 || n.Name2 || n.Name3 || n.Name4 || n.Name5 || '';
            } else if (n.NameType === 'Alias') {
              aliases.push(n.Name6 || n.Name1 || n.Name2 || n.Name3 || n.Name4 || n.Name5 || '');
            }
          }
        }

        const addressList = [];
        const countriesList = [];
        if (desig.Addresses && desig.Addresses.Address) {
          const addrArray = Array.isArray(desig.Addresses.Address) ? desig.Addresses.Address : [desig.Addresses.Address];
          for (const a of addrArray) {
            const fullAddr = [a.AddressLine1, a.AddressLine2, a.AddressLine3, a.AddressLine4, a.AddressLine5, a.AddressLine6].filter(Boolean).join(', ');
            if (fullAddr) addressList.push(fullAddr);
            if (a.AddressCountry && !countriesList.includes(a.AddressCountry)) {
              countriesList.push(a.AddressCountry);
            }
          }
        }

        const sanctions = desig.SanctionsImposed || null;

        const phonesList = [];
        if (desig.PhoneNumbers && desig.PhoneNumbers.PhoneNumber) {
          const phoneArray = Array.isArray(desig.PhoneNumbers.PhoneNumber) ? desig.PhoneNumbers.PhoneNumber : [desig.PhoneNumbers.PhoneNumber];
          phonesList.push(...phoneArray);
        }

        const emailsList = [];
        if (desig.EmailAddresses && desig.EmailAddresses.EmailAddress) {
          const emailArray = Array.isArray(desig.EmailAddresses.EmailAddress) ? desig.EmailAddresses.EmailAddress : [desig.EmailAddresses.EmailAddress];
          emailsList.push(...emailArray);
        }

        const programId = desig.OFSIGroupID || desig.UNReferenceNumber || null;
        const dataset = desig.DesignationSource || desig.RegimeName || null;
        const firstSeen = desig.DateDesignated || null;
        const lastSeen = desig.LastUpdated || null;
        const lastChange = desig.LastUpdated || null;

        const formatDate = (d) => {
          if (!d) return null;
          const parts = String(d).split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return d;
        };

        const query = `
          INSERT INTO compliance_dataxml (
            id, schema, name, aliases, birth_date, countries, addresses, identifiers, sanctions, phones, emails, program_id, dataset, first_seen, last_seen, last_change
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          ) ON CONFLICT (id) DO UPDATE SET
            schema = EXCLUDED.schema,
            name = EXCLUDED.name,
            aliases = EXCLUDED.aliases,
            countries = EXCLUDED.countries,
            addresses = EXCLUDED.addresses,
            sanctions = EXCLUDED.sanctions,
            phones = EXCLUDED.phones,
            emails = EXCLUDED.emails,
            program_id = EXCLUDED.program_id,
            dataset = EXCLUDED.dataset,
            first_seen = EXCLUDED.first_seen,
            last_seen = EXCLUDED.last_seen,
            last_change = EXCLUDED.last_change
        `;

        const values = [
          String(id),
          schema ? String(schema) : null,
          primaryName ? String(primaryName) : null,
          aliases.length ? aliases.join('; ') : null,
          null, // birth_date
          countriesList.length ? countriesList.join('; ') : null,
          addressList.length ? addressList.join('; ') : null,
          null, // identifiers
          sanctions ? String(sanctions) : null,
          phonesList.length ? phonesList.join('; ') : null,
          emailsList.length ? emailsList.join('; ') : null,
          programId ? String(programId) : null,
          dataset ? String(dataset) : null,
          formatDate(firstSeen),
          formatDate(lastSeen),
          formatDate(lastChange)
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    fs.unlinkSync(req.file.path);

    res.status(200).json({ message: 'XML uploaded and parsed successfully', recordsProcessed: designations.length });
  } catch (err) {
    console.error('Error processing XML:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process XML file' });
  }
});

// New endpoint for local XML imports
app.post('/api/import-local-xml', async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename is required' });

  const filePath = `D:/import/${filename}`;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server disk' });

  try {
    const xmlData = fs.readFileSync(filePath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, explicitArray: false });
    const result = parser.parse(xmlData);

    let designations = [];
    if (result.Designations && result.Designations.Designation) {
      if (Array.isArray(result.Designations.Designation)) {
        designations = result.Designations.Designation;
      } else {
        designations = [result.Designations.Designation];
      }
    } else if (result.Designation) {
      // In case it doesn't have the Designations wrapper
      designations = Array.isArray(result.Designation) ? result.Designation : [result.Designation];
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      for (const desig of designations) {
        const uniqueId = desig.UniqueID || null;
        if (!uniqueId) continue;

        const query = `
          INSERT INTO compliance_dataxml (
            unique_id, last_updated, date_designated, ofsi_group_id, un_reference_number,
            names, non_latin_names, regime_name, individual_entity_ship, designation_source,
            sanctions_imposed, sanctions_imposed_indicators, other_information, 
            uk_statement_of_reasons, addresses, phone_numbers, email_addresses
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) ON CONFLICT (unique_id) DO UPDATE SET
            last_updated = EXCLUDED.last_updated,
            date_designated = EXCLUDED.date_designated,
            ofsi_group_id = EXCLUDED.ofsi_group_id,
            un_reference_number = EXCLUDED.un_reference_number,
            names = EXCLUDED.names,
            non_latin_names = EXCLUDED.non_latin_names,
            regime_name = EXCLUDED.regime_name,
            individual_entity_ship = EXCLUDED.individual_entity_ship,
            designation_source = EXCLUDED.designation_source,
            sanctions_imposed = EXCLUDED.sanctions_imposed,
            sanctions_imposed_indicators = EXCLUDED.sanctions_imposed_indicators,
            other_information = EXCLUDED.other_information,
            uk_statement_of_reasons = EXCLUDED.uk_statement_of_reasons,
            addresses = EXCLUDED.addresses,
            phone_numbers = EXCLUDED.phone_numbers,
            email_addresses = EXCLUDED.email_addresses
        `;

        const ensureArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];

        const values = [
          uniqueId,
          desig.LastUpdated || null,
          desig.DateDesignated || null,
          desig.OFSIGroupID || null,
          desig.UNReferenceNumber || null,
          desig.Names ? JSON.stringify(ensureArray(desig.Names.Name)) : null,
          desig.NonLatinNames ? JSON.stringify(ensureArray(desig.NonLatinNames.NonLatinName)) : null,
          desig.RegimeName || null,
          desig.IndividualEntityShip || null,
          desig.DesignationSource || null,
          desig.SanctionsImposed || null,
          desig.SanctionsImposedIndicators ? JSON.stringify(desig.SanctionsImposedIndicators) : null,
          desig.OtherInformation || null,
          desig.UKStatementofReasons || null,
          desig.Addresses ? JSON.stringify(ensureArray(desig.Addresses.Address)) : null,
          desig.PhoneNumbers ? JSON.stringify(ensureArray(desig.PhoneNumbers.PhoneNumber)) : null,
          desig.EmailAddresses ? JSON.stringify(ensureArray(desig.EmailAddresses.EmailAddress)) : null
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    res.status(200).json({ message: 'XML imported successfully', recordsProcessed: designations.length });
  } catch (err) {
    console.error('Error importing XML:', err);
    res.status(500).json({ error: 'Failed to import XML file' });
  }
});

// New endpoint for local Excel/CSV imports
app.post('/api/import-local-excel', async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename is required' });

  const filePath = `D:/import/${filename}`;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server disk' });

  try {
    const workbook = xlsx.readFile(filePath, { codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON array of objects
    const data = xlsx.utils.sheet_to_json(sheet);
    // console.log(data)
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or could not be parsed' });
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      for (const row of data) {
        // Assume Excel columns match the database column names directly
        const id = row.id || row.ID || row.UniqueID || null;
        if (!id) continue;

        const query = `
          INSERT INTO compliance_data (
            id, schema, name, aliases, birth_date, countries, addresses, identifiers, sanctions, phones, emails, program_id, dataset, first_seen, last_seen, last_change
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          ) ON CONFLICT (id) DO UPDATE SET
            schema = EXCLUDED.schema,
            name = EXCLUDED.name,
            aliases = EXCLUDED.aliases,
            birth_date = EXCLUDED.birth_date,
            countries = EXCLUDED.countries,
            addresses = EXCLUDED.addresses,
            identifiers = EXCLUDED.identifiers,
            sanctions = EXCLUDED.sanctions,
            phones = EXCLUDED.phones,
            emails = EXCLUDED.emails,
            program_id = EXCLUDED.program_id,
            dataset = EXCLUDED.dataset,
            first_seen = EXCLUDED.first_seen,
            last_seen = EXCLUDED.last_seen,
            last_change = EXCLUDED.last_change
        `;

        // Helper to safely stringify objects/arrays if they appear in Excel cells (rare, but just in case)
        const s = (val) => val === undefined || val === null ? null : (typeof val === 'object' ? JSON.stringify(val) : String(val));

        const values = [
          s(id),
          s(row.schema || row.Schema),
          s(row.name || row.Name || row.PrimaryName),
          s(row.aliases || row.Aliases),
          s(row.birth_date || row.BirthDate),
          s(row.countries || row.Countries),
          s(row.addresses || row.Addresses),
          s(row.identifiers || row.Identifiers),
          s(row.sanctions || row.Sanctions),
          s(row.phones || row.Phones || row.PhoneNumbers),
          s(row.emails || row.Emails || row.EmailAddresses),
          s(row.program_id || row.ProgramID),
          s(row.dataset || row.Dataset),
          s(row.first_seen || row.FirstSeen || row.DateDesignated),
          s(row.last_seen || row.LastSeen || row.LastUpdated),
          s(row.last_change || row.LastChange)
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    res.status(200).json({ message: 'Excel/CSV imported successfully', recordsProcessed: data.length });
  } catch (err) {
    console.error('Error importing Excel:', err);
    res.status(500).json({ error: 'Failed to import Excel/CSV file' });
  }
});

// Endpoint to list files in D:/import
app.get('/api/import-files', (req, res) => {
  const dirPath = 'D:/import';
  try {
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ error: 'Directory D:/import not found' });
    }
    const files = fs.readdirSync(dirPath);
    // filter only files if needed, but returning all for now
    const fileNames = files.filter(f => fs.statSync(`${dirPath}/${f}`).isFile());
    res.json(fileNames);
  } catch (err) {
    console.error('Error reading directory:', err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

app.get("/api/transactions/:accountNumber/:date", async (req, res) => {
  try {
    const { accountNumber, date } = req.params;

    const authUrl = 'http://10.1.22.234:5050/api/user/login';
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: "yalemzewdud", password: "Lib@1234", deviceId: "dev-1789800095076-5su90jct6cd" })
    });

    const authResponseJson = await authResponse.json();

    const apiUrl = `http://10.1.22.234:5050/api/receipt/transactions?accountNumber=${accountNumber}&date=${date}`;
    const response = await fetch(apiUrl, {
      headers: { 'Authorization': authResponseJson.token }
    });
    const result = await response.json();
    console.log(result)
    if (!result.success || !result.data) {
      return res.status(404).json({ message: "No transactions found" });
    }

    res.json(result.data);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get("/api/receipt/:referenceId", async (req, res) => {
  const sftp = new SftpClient();
  try {
    const { referenceId } = req.params;
    console.log(`\n--- Fetching Receipt ---`);
    console.log(`Reference ID: ${referenceId}`);
    console.log(`------------------------\n`);

    const filename = `${referenceId}.pdf`;

    const path1 = `/etc/nginx/Receipt_Generate/Receipt/${filename}`;
    const path2 = `/receipts/${filename}`;

    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
    });

    let targetPath = null;

    if (await sftp.exists(path1)) {
      targetPath = path1;
    } else if (await sftp.exists(path2)) {
      targetPath = path2;
    }

    if (!targetPath) {
      await sftp.end();
      return res.status(404).json({
        message: "Receipt PDF not found on Linux server",
        referenceId
      });
    }

    console.log(targetPath, 'targetpath')
    res.setHeader('Content-Type', 'application/pdf');
    await sftp.get(targetPath, res);
    await sftp.end();

  } catch (error) {
    console.error('Error fetching receipt over SFTP:', error);
    sftp.end().catch(() => { });
    return res.status(500).json({
      message: "Unable to retrieve receipt"
    });
  }
});


initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
