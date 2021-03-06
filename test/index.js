import assert from 'assert';
import util from 'util';
import Sheets from './../src';

const SPREADSHEET_TEST_ID = '1amfst1WVcQDntGe6walYt-4O5SCrHBD5WntbjhvfIm4';
const SPREADSHEET_JWT_KEY = require('./cred/node-sheets-test.json');
const SPREADSHEET_API_KEY = 'AIzaSyAwwdh_6ktghYF_AgP5pT9EfeiYWVCTr1Q';

describe('Sheets', function() {
  this.timeout(20000);

  describe('#constructor', function() {
    it('should exist and be a function', () => {
      assert.equal(typeof Sheets, 'function');
    });

    it('should throw Error with empty spreadsheetId in the constructor', () => {
      assert.throws(() => {
        new Sheets();
      }, Error);
    });

    it('should accept a string with spreadsheetId', () => {
      assert.notEqual(new Sheets(SPREADSHEET_TEST_ID), null);
    });
  });

  describe('#authorize', function() {
    const gs = new Sheets(SPREADSHEET_TEST_ID);

    it('should throw Error with no args in authorizeJWT', async () => {
      try {
        await gs.authorizeJWT();
        assert.fail();
      } catch (err) {
        assert.equal(err.constructor, Error);
      }
    });

    it('should throw Error with no args in authorizeApiKey', async () => {
      try {
        await gs.authorizeJWT();
        assert.fail();
      } catch (err) {
        assert.equal(err.constructor, Error);
      }
    });

    it('should authenticate with valid JWT credentials', async () => {
      await gs.authorizeJWT(SPREADSHEET_JWT_KEY);
    });

    it('should authenticate with valid API KEY credentials', async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
    });
  });

  describe('#getSheetsNames', () => {
    it('should return a list of sheets names', async () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID);
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
      const names = await gs.getSheetsNames();
      assert.deepEqual(names, [
        'Class Data',
        'Table with empty cells',
        'Formats',
        'Empty',
        'blue',
        'D001',
        'D002'
      ]);
    });
  });

  describe('#getLastUpdateDate', () => {
    it('should return a valid date string', async () => {
      // ex: 2016-09-21T15:37:15.250Z
      const gs = new Sheets(SPREADSHEET_TEST_ID);
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
      const updateDate = await gs.getLastUpdateDate();
      assert.notEqual(updateDate, null);
      const date = new Date(updateDate);
      assert.equal(date.constructor, Date);
    });
  });

  describe('#tables', () => {
    it('should retrieve all sheets', async () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID);
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
      const names = await gs.getSheetsNames();
      const tables = await gs.tables(names.map(name => ({ name: name })));
      //console.log(util.inspect(tables, { depth: null, colors: true }))
      assert.equal(tables.length, names.length);
      assert.deepEqual(
        tables.map(t => t.title),
        names
      );

      // const table = tables[0]
      // console.log(util.inspect(table.headers, { depth: null, colors: true }))
      // console.log(util.inspect(table.formats, { depth: null, colors: true }))
      // console.log(util.inspect(table.rows, { depth: null, colors: true }))
    });
  });

  describe('#tables (Formats!A1:E3)', () => {
    const gs = new Sheets(SPREADSHEET_TEST_ID);
    before(async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
    });

    it('should return formatted tabular spreadsheet data', async () => {
      const table = await gs.tables('Formats!A1:E3');
      // console.log(util.inspect(table, { depth: null, colors: true }))
      assert.deepEqual(table.headers, [
        'Automatic',
        'Currency',
        'Date',
        'Number',
        'Plain Text'
      ]);
      assert.deepEqual(
        table.formats.map(f => f.numberFormat.type),
        ['NONE', 'CURRENCY', 'DATE', 'NUMBER', 'TEXT']
      );
      assert.equal(table.rows.length, 2);
      assert.deepEqual(Object.keys(table.rows[0]), [
        'Automatic',
        'Currency',
        'Date',
        'Number',
        'Plain Text'
      ]);
      assert.deepEqual(table.rows[0]['Automatic'], {
        value: 'Oil',
        stringValue: 'Oil'
      });
      assert.deepEqual(table.rows[0]['Currency'], {
        value: 0.41,
        stringValue: '$0.41'
      });
      assert.deepEqual(table.rows[0]['Date'], {
        value: new Date(2016, 0, 25),
        stringValue: '1/25/2016'
      });
      assert.deepEqual(table.rows[0]['Number'], {
        value: 123,
        stringValue: '123.00'
      });
      assert.deepEqual(table.rows[0]['Plain Text'], {
        value: 'This is some text',
        stringValue: 'This is some text'
      });
    });

    it('should return formatted tabular (tableCols) spreadsheet data', async () => {
      const cols = await gs.tableCols('Formats!A1:E3');
      assert.equal(cols.length, 5);
      assert.deepEqual(
        cols.map(c => c.header),
        ['Automatic', 'Currency', 'Date', 'Number', 'Plain Text']
      );
      assert.equal(cols[0].header, 'Automatic');
    });
  });

  describe('#table (Class Data)', () => {
    const gs = new Sheets(SPREADSHEET_TEST_ID);
    before(async () => {
      await gs.authorizeApiKey(SPREADSHEET_API_KEY);
    });

    it('should retrieve only cols and rows with content (8 cols and 2 rows - from "Class Data")', async () => {
      const table = await gs.tables('Class Data');
      assert.equal(table.headers.length, 8);
      assert.equal(table.rows.length, 2);
      // console.log(util.inspect(table, { depth: null, colors: true, breakLength: Infinity }))
    });

    it('should use named range instead of sheet name for special names', async () => {
      const table = await gs.tables('A02');
      // console.log(util.inspect(table, { depth: null, colors: true, breakLength: Infinity }))
      assert.equal(table.rows.length, 0);
      assert.equal(table.headers.length, 1);
      assert.equal(table.headers[0], 'Thomas');
    });

    it('should retrieve empty cells as undefined (5 cols and 3 rows - from "Table with empty cells")', async () => {
      const table = await gs.tables('Table with empty cells');
      // console.log(util.inspect(table, { depth: null, colors: true, breakLength: Infinity }))
      assert.equal(table.headers.length, 5);
      assert.equal(table.rows.length, 3);
      assert.deepEqual(
        Object.keys(table.rows[1]).map(col => table.rows[1][col].value),
        ['Andrew', undefined, '1. Freshman', 'SD', 'Math']
      );
      assert.deepEqual(
        Object.keys(table.rows[2]).map(col => table.rows[2][col].value),
        ['Anna', 'Female', undefined, undefined, 'English']
      );
    });
  });

  describe('works with Promises', () => {
    it('should throw Error with no args in authorization', () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID);
      gs.authorizeJWT()
        .then(() => assert.fail())
        .catch(err => assert.equal(err.constructor, Error));
    });

    it('should be able to chain .then() calls, and also .catch()', () => {
      const gs = new Sheets(SPREADSHEET_TEST_ID);
      const authData = SPREADSHEET_JWT_KEY;
      gs.authorizeJWT(authData)
        .then(() => gs.tables('Formats!A1:E3'))
        .then(table => {
          assert.notEqual(table.headers, null);
          assert.notEqual(table.formats, null);
          assert.notEqual(table.rows, null);
        })
        .catch(err => {
          console.error(err);
        });
    });
  });
});
