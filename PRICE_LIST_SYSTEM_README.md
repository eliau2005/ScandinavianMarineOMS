# Price List Management System - Complete Guide

## Overview

The Price List Management System is a comprehensive solution for managing product pricing in the Scandinavian Marine OMS. It provides suppliers with a flexible, stable, and user-friendly interface to create, edit, and export price lists.

## Features

### ✅ Completed Features

1. **Price List CRUD Operations**
   - Create new price lists with custom names and effective dates
   - View all price lists with status indicators (Draft, Active, Archived)
   - Edit existing price lists
   - Delete price lists (except active ones)
   - Duplicate price lists for quick creation

2. **Product & Category Management**
   - Hierarchical organization by product categories
   - Support for complex product attributes (trim type, size, skin type, packaging)
   - Flexible pricing tiers (box pricing, vacuum packaging pricing)
   - Automatic VAC surcharge calculation

3. **Advanced Table Interface**
   - Built with TanStack Table v8 for maximum flexibility
   - Sortable columns
   - Editable price fields (in edit mode)
   - Real-time price updates
   - View-only mode for finalized price lists

4. **PDF Export**
   - Export price lists matching the original layout
   - Multi-column PDF generation
   - Category-based organization
   - Simplified export option
   - Professional formatting

5. **Data Validation**
   - Zod schema validation for all data types
   - Type-safe operations with TypeScript
   - Comprehensive error handling

6. **Status Management**
   - Draft: Work-in-progress price lists
   - Active: Published and in-use price lists
   - Archived: Historical price lists

## Technology Stack

### Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **@tanstack/react-table** | Latest | Advanced table functionality with sorting, filtering |
| **zod** | Latest | Schema validation and type inference |
| **react-hook-form** | Latest | Form state management |
| **@hookform/resolvers** | Latest | Zod integration with React Hook Form |
| **date-fns** | Latest | Date formatting and manipulation |
| **jspdf** | Latest | PDF generation |
| **jspdf-autotable** | Latest | Table generation in PDFs |

### Why These Libraries?

#### TanStack Table (React Table v8)
- **Flexibility**: Handles complex column structures (price_box, price_box_vac)
- **Performance**: Virtualization support for large datasets
- **TypeScript**: Excellent type safety
- **Extensibility**: Easy to add filtering, sorting, pagination

#### Zod
- **Type Inference**: Automatically generates TypeScript types from schemas
- **Validation**: Runtime validation for all data
- **Error Messages**: Clear, user-friendly validation errors
- **Composability**: Reusable schemas for complex data structures

#### jsPDF + jsPDF-autotable
- **Proven**: Industry-standard PDF generation
- **Customization**: Full control over layout and styling
- **Performance**: Client-side generation (no server required)
- **Compatibility**: Works across all browsers

## Architecture

### File Structure

```
ScandinavianMarineOMS/
├── components/
│   ├── dashboards/
│   │   └── supplier/
│   │       ├── PriceListManagement.tsx    # Main page
│   │       └── IncomingOrders.tsx         # Orders page
│   └── priceList/
│       ├── PriceTable.tsx                 # Reusable table component
│       ├── PriceListCard.tsx              # Price list card component
│       └── CreatePriceListModal.tsx       # Create modal
├── lib/
│   ├── priceListService.ts                # Appwrite service layer
│   ├── pdfExport.ts                       # PDF export functions
│   └── appwrite.ts                        # Appwrite client
├── types/
│   └── priceList.ts                       # TypeScript types & Zod schemas
└── docs/
    ├── APPWRITE_PRICE_LIST_SETUP.md       # Database setup instructions
    └── PRICE_LIST_SYSTEM_README.md        # This file
```

### Data Flow

```
User Action
    ↓
React Component (PriceListManagement.tsx)
    ↓
Service Layer (priceListService.ts)
    ↓
Appwrite SDK
    ↓
Appwrite Database (Collections)
    ↓
Data Returns to Component
    ↓
UI Updates
```

### Database Schema

The system uses **4 Appwrite collections**:

1. **price_lists**: Main price list documents
2. **product_categories**: Product categories (Salmon, Cod, etc.)
3. **products**: Individual products with attributes
4. **price_list_items**: Prices for specific products in a price list

See `APPWRITE_PRICE_LIST_SETUP.md` for detailed setup instructions.

## Usage Guide

### For Suppliers

#### 1. Creating a New Price List

1. Navigate to **Supplier Portal → Price List Management**
2. Click **"New Price List"** button
3. Fill in the form:
   - **Name**: e.g., "Weekly Price List 12-11-2025"
   - **Effective Date**: When this price list becomes active
   - **Expiry Date** (optional): When it expires
   - **Notes** (optional): Internal notes
   - **Set as Default** checkbox
4. Click **"Create Price List"**
5. You'll be redirected to the edit view

#### 2. Editing Prices

1. Select a price list from the grid
2. Click **"Edit"**
3. Enter prices in the **Price/Box** and **Price/Box (VAC)** columns
4. The system automatically calculates VAC surcharges
5. Click **"Save Prices"** when done

#### 3. Exporting to PDF

1. Open a price list (view or edit mode)
2. Click **"Export PDF"** button
3. The PDF will download automatically
4. PDF matches the original price list layout

#### 4. Managing Price Lists

- **View**: Read-only mode for reviewing prices
- **Edit**: Modify prices and save changes
- **Duplicate**: Create a copy with a new name/date
- **Set Active**: Activate a draft price list
- **Delete**: Remove draft or archived price lists (not active ones)

### For Administrators

#### Setting Up Products

1. Create product categories in Appwrite:
   - Go to `product_categories` collection
   - Add categories: Salmon, Cod, Turbot, etc.
   - Set `display_order` for sorting

2. Create products in Appwrite:
   - Go to `products` collection
   - Link to a category via `category_id`
   - Fill in attributes (trim type, size, skin type, etc.)

## API Reference

### Price List Service

```typescript
// Get all price lists for a supplier
const lists = await priceListService.getBySupplier(supplierId);

// Get active price lists only
const activeLists = await priceListService.getActiveBySupplier(supplierId);

// Get price list with all items and product details
const details = await priceListService.getWithItems(priceListId);

// Create a new price list
const newList = await priceListService.create(priceListData);

// Update a price list
const updated = await priceListService.update(id, { status: "active" });

// Duplicate a price list
const copy = await priceListService.duplicate(id, newName, newDate);

// Delete a price list
await priceListService.delete(id);
```

### Product Service

```typescript
// Get all products
const products = await productService.getAll();

// Get products by category
const salmonProducts = await productService.getByCategory(categoryId);

// Get products with category information
const productsWithCategories = await productService.getAllWithCategories();

// Create a product
const newProduct = await productService.create(productData);
```

### Price List Item Service

```typescript
// Get all items for a price list
const items = await priceListItemService.getByPriceList(priceListId);

// Create a price list item
const item = await priceListItemService.create(itemData);

// Update prices
const updated = await priceListItemService.update(itemId, { price_box: 12.50 });

// Bulk operations
await priceListItemService.bulkCreate([item1, item2, item3]);
await priceListItemService.bulkUpdate([{id, data}, {id, data}]);
```

### PDF Export

```typescript
// Export with original layout
exportPriceListToPDF(priceList, tableData);

// Export simplified version
exportSimplePriceListToPDF(priceList, tableData);
```

## Customization

### Adding New Product Attributes

1. Update `types/priceList.ts`:
```typescript
export const ProductSchema = z.object({
  // ... existing fields
  new_attribute: z.string().optional(),
});
```

2. Update Appwrite collection:
   - Add new attribute to `products` collection

3. Update UI components to display the new field

### Changing PDF Layout

Edit `lib/pdfExport.ts`:
- Modify column widths in `columnStyles`
- Change fonts, colors, spacing
- Add/remove sections

### Adding Pricing Tiers

1. Add new fields to `PriceListItemSchema` in `types/priceList.ts`
2. Update `price_list_items` collection in Appwrite
3. Modify `PriceTable.tsx` to display new columns
4. Update save logic in `PriceListManagement.tsx`

## Troubleshooting

### Common Issues

#### 1. "Failed to load price lists"
- **Cause**: Appwrite connection issue or permissions
- **Solution**: Check Appwrite credentials in `.env`, verify collection permissions

#### 2. Prices not saving
- **Cause**: Missing collection IDs or invalid data
- **Solution**: Check browser console for errors, verify Zod validation

#### 3. PDF export not working
- **Cause**: Missing data or jsPDF error
- **Solution**: Ensure price list has items, check console for errors

#### 4. Products not showing in table
- **Cause**: No products in database or category mismatch
- **Solution**: Verify products exist in Appwrite `products` collection

### Debug Mode

Enable detailed logging:
```typescript
// In priceListService.ts, uncomment:
console.log("Loading price lists...", lists);
console.log("Products:", products);
console.log("Categories:", categories);
```

## Performance Optimization

### Current Optimizations

1. **Parallel Data Fetching**: Uses `Promise.all()` for simultaneous requests
2. **Efficient Mapping**: Uses `Map` for O(1) lookups instead of nested loops
3. **Memoization**: TanStack Table handles internal memoization
4. **Lazy Loading**: Components load only when needed

### Future Improvements

1. **Pagination**: For price lists with 1000+ products
2. **Virtual Scrolling**: For very long product tables
3. **Caching**: Cache product/category data locally
4. **Batch Updates**: Group price updates for better performance

## Security Considerations

### Current Security Measures

1. **Role-Based Access**: Appwrite permissions per role
2. **Input Validation**: Zod schemas validate all inputs
3. **Type Safety**: TypeScript prevents type errors
4. **Sanitization**: No direct HTML injection

### Best Practices

- Never expose Appwrite credentials in client code
- Always validate user input before saving
- Use Appwrite's built-in authentication
- Implement rate limiting for API calls (Appwrite Pro)

## Migration & Data Import

### Importing Existing Price Lists

Create a migration script:

```typescript
import { priceListService, productService } from "./lib/priceListService";

const importPriceList = async (csvData) => {
  // 1. Create price list
  const priceList = await priceListService.create({
    name: "Imported Price List",
    supplier_id: "...",
    // ...
  });

  // 2. Parse CSV and create items
  for (const row of csvData) {
    const product = await productService.getByName(row.productName);
    await priceListItemService.create({
      price_list_id: priceList.$id,
      product_id: product.$id,
      price_box: parseFloat(row.price),
      // ...
    });
  }
};
```

## Testing

### Manual Testing Checklist

- [ ] Create a new price list
- [ ] Edit prices and save
- [ ] Export to PDF and verify layout
- [ ] Duplicate a price list
- [ ] Set a price list as active
- [ ] Delete a draft price list
- [ ] Try to delete an active price list (should fail)
- [ ] View a price list in read-only mode
- [ ] Test with empty price lists
- [ ] Test with 100+ products

### Automated Testing (Future)

```typescript
// Example test with Jest/Vitest
describe("PriceListService", () => {
  it("should create a price list", async () => {
    const priceList = await priceListService.create(mockData);
    expect(priceList.$id).toBeDefined();
  });
});
```

## Support & Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Review and archive old price lists
2. **Quarterly**: Optimize database indexes in Appwrite
3. **Yearly**: Update dependencies (`npm update`)

### Getting Help

- **Appwrite Docs**: https://appwrite.io/docs
- **TanStack Table Docs**: https://tanstack.com/table/latest
- **Zod Docs**: https://zod.dev

## Changelog

### Version 1.0.0 (2025-11-10)
- Initial release
- Full CRUD for price lists
- PDF export functionality
- TanStack Table integration
- Zod validation
- Appwrite integration

---

**Last Updated**: November 10, 2025
**Author**: Claude Code
**Version**: 1.0.0
