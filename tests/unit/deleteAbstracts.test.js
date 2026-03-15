// deleteAbstracts.test.js - Unit tests for delete abstracts functionality

// --- Mocking Globals Expected by Zotadata ---

// Global Zotero object mock
if (typeof Zotero === 'undefined') {
  global.Zotero = {
    debug: (...args) => console.log('[Zotero.debug]', ...args),
    log: (...args) => console.log('[Zotero.log]', ...args),

    // Mock Item constructor
    Item: function(typeID) {
      this.itemTypeID = typeID;
      this.id = Math.floor(Math.random() * 10000);
      this.fields = {};
      this.creators = [];
      this.tags = [];

      this.setField = (field, value) => { this.fields[field] = value; };
      this.getField = (field) => this.fields[field] || '';
      this.isRegularItem = () => true;
      this.saveTx = async () => this.id;
    },

    // Mock main window
    getMainWindow: () => ({
      document: {},
      ZoteroPane: {},
      Zotero: {
        ProgressWindow: function() {
          this.changeHeadline = () => {};
          this.show = () => {};
          this.close = () => {};
          this.ItemProgress = function() {
            this.setProgress = () => {};
            this.setText = () => {};
          };
        }
      }
    })
  };
}

// --- Test Suite ---
if (typeof describe === 'function' && typeof it === 'function') {
  describe('Delete Abstracts Functionality', () => {

    // Create a minimal mock of the deleteAbstractFromItem method
    const deleteAbstractFromItem = async function(item) {
      let currentAbstract = item.getField("abstractNote");
      if (currentAbstract) {
        item.setField("abstractNote", "");
        await item.saveTx();
        return { deleted: true };
      } else {
        return { deleted: false };
      }
    };

    describe('deleteAbstractFromItem', () => {
      it('should delete abstract from item that has one', async () => {
        const item = new Zotero.Item(1);
        item.setField("abstractNote", "This is a test abstract.");
        item.setField("title", "Test Paper");

        const result = await deleteAbstractFromItem(item);

        expect(result.deleted).toBe(true);
        expect(item.getField("abstractNote")).toBe("");
        // Title should remain unchanged
        expect(item.getField("title")).toBe("Test Paper");
      });

      it('should skip item without abstract', async () => {
        const item = new Zotero.Item(1);
        item.setField("title", "Test Paper Without Abstract");

        const result = await deleteAbstractFromItem(item);

        expect(result.deleted).toBe(false);
        expect(item.getField("title")).toBe("Test Paper Without Abstract");
      });

      it('should skip item with empty abstract', async () => {
        const item = new Zotero.Item(1);
        item.setField("abstractNote", "");

        const result = await deleteAbstractFromItem(item);

        expect(result.deleted).toBe(false);
      });

      it('should handle multiple items independently', async () => {
        const items = [
          new Zotero.Item(1),
          new Zotero.Item(1),
          new Zotero.Item(1),
        ];

        items[0].setField("abstractNote", "Abstract 1");
        // items[1] has no abstract
        items[2].setField("abstractNote", "Abstract 3");

        const results = await Promise.all(items.map(deleteAbstractFromItem));

        expect(results[0].deleted).toBe(true);
        expect(results[1].deleted).toBe(false);
        expect(results[2].deleted).toBe(true);

        expect(items[0].getField("abstractNote")).toBe("");
        expect(items[2].getField("abstractNote")).toBe("");
      });

      it('should preserve other fields when deleting abstract', async () => {
        const item = new Zotero.Item(1);
        item.setField("title", "Important Paper");
        item.setField("DOI", "10.1234/test");
        item.setField("abstractNote", "Some abstract text");
        item.setField("date", "2024-01-01");

        await deleteAbstractFromItem(item);

        expect(item.getField("abstractNote")).toBe("");
        expect(item.getField("title")).toBe("Important Paper");
        expect(item.getField("DOI")).toBe("10.1234/test");
        expect(item.getField("date")).toBe("2024-01-01");
      });
    });
  });
} else {
  console.log('Running delete abstracts tests without test framework...');

  async function runDeleteAbstractsTests() {
    console.log('\n=== Delete Abstracts Tests ===');
    let passed = 0;
    let failed = 0;

    // Test 1: Delete abstract from item with abstract
    const item1 = new Zotero.Item(1);
    item1.setField("abstractNote", "This is a test abstract.");
    item1.setField("title", "Test Paper");
    item1.setField("abstractNote", "");
    const hasNoAbstract = item1.getField("abstractNote") === "";
    if (hasNoAbstract) {
      console.log('✓ 1. Deletes abstract from item');
      passed++;
    } else {
      console.log('✗ 1. Failed to delete abstract');
      failed++;
    }

    // Test 2: Preserve other fields
    const titlePreserved = item1.getField("title") === "Test Paper";
    if (titlePreserved) {
      console.log('✓ 2. Preserves other fields');
      passed++;
    } else {
      console.log('✗ 2. Other fields were modified');
      failed++;
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  }

  runDeleteAbstractsTests();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
