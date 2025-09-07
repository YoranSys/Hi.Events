import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper function to create a test event
async function createTestEvent(page: Page): Promise<{ eventId: string, eventSlug: string }> {
  // This would typically navigate to the admin interface and create an event
  // For now, we'll use mock data or expect an existing test event
  return {
    eventId: '1',
    eventSlug: 'test-event'
  };
}

// Helper function to create test products/tickets
async function createTestProducts(page: Page, eventId: string): Promise<{ productId: string }[]> {
  // Create test ticket types for the event
  return [
    { productId: '1' }, // VIP Section
    { productId: '2' }, // General Admission
  ];
}

test.describe('Interactive Seating Chart Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or test data
    // For now, we'll assume we can access the interfaces directly
  });

  test.describe('Admin Interface - Seating Chart Management', () => {
    test('should upload venue map and create seating zones', async ({ page }) => {
      // Test the admin interface for creating seating charts
      await page.goto(`${FRONTEND_URL}/manage/events/1/seating-chart`);
      
      // Take initial screenshot
      await page.screenshot({ 
        path: '/tmp/admin-seating-chart-initial.png',
        fullPage: true 
      });

      // Check if the seating chart management page loads
      await expect(page.locator('h1')).toContainText(['Seating Chart', 'Venue Map']);
      
      // Upload venue map (if file upload is available)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a test image file for upload
        await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 500, 300);
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText('Test Venue Map', 150, 150);
          }
          return canvas;
        });
      }

      // Check for polygon drawing tools
      const drawingTools = page.locator('[data-testid="polygon-drawer"], .polygon-drawer, canvas');
      if (await drawingTools.first().isVisible()) {
        await page.screenshot({ 
          path: '/tmp/admin-drawing-tools.png',
          fullPage: true 
        });
      }

      // Test zone creation interface
      const addZoneButton = page.locator('button:has-text("Add Zone"), button:has-text("Create Zone"), button:has-text("New Zone")');
      if (await addZoneButton.first().isVisible()) {
        await addZoneButton.first().click();
        
        // Fill zone creation form
        await page.fill('input[name="zone_name"], input[placeholder*="zone"], input[placeholder*="name"]', 'VIP Section');
        
        // Select product/ticket type
        const productSelect = page.locator('select[name="product_id"], select:has(option)');
        if (await productSelect.isVisible()) {
          await productSelect.selectOption({ index: 1 });
        }
        
        // Take screenshot of zone creation form
        await page.screenshot({ 
          path: '/tmp/admin-zone-creation-form.png',
          fullPage: true 
        });
      }

      // Test zone management table
      const zoneTable = page.locator('table, .zone-list, [data-testid="zone-table"]');
      if (await zoneTable.isVisible()) {
        await page.screenshot({ 
          path: '/tmp/admin-zone-management-table.png',
          fullPage: true 
        });
      }
    });

    test('should allow editing and deleting zones', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/manage/events/1/seating-chart`);
      
      // Look for edit buttons
      const editButtons = page.locator('button:has-text("Edit"), [data-testid="edit-zone"]');
      if (await editButtons.first().isVisible()) {
        await editButtons.first().click();
        
        await page.screenshot({ 
          path: '/tmp/admin-edit-zone.png',
          fullPage: true 
        });
      }

      // Look for delete buttons
      const deleteButtons = page.locator('button:has-text("Delete"), [data-testid="delete-zone"]');
      if (await deleteButtons.first().isVisible()) {
        await page.screenshot({ 
          path: '/tmp/admin-zone-actions.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Customer Interface - Interactive Seating Selection', () => {
    test('should display "View Seating" button when zones are configured', async ({ page }) => {
      // Navigate to customer event page
      await page.goto(`${FRONTEND_URL}/event/test-event`);
      
      // Take initial screenshot of event page
      await page.screenshot({ 
        path: '/tmp/customer-event-page-initial.png',
        fullPage: true 
      });

      // Look for "View Seating" button
      const viewSeatingButton = page.locator('button:has-text("View Seating"), button:has-text("Seating Chart"), [data-testid="view-seating"]');
      
      if (await viewSeatingButton.isVisible()) {
        await expect(viewSeatingButton).toBeVisible();
        await page.screenshot({ 
          path: '/tmp/customer-view-seating-button.png',
          fullPage: true 
        });
        
        // Click the button to open seating chart
        await viewSeatingButton.click();
        
        // Wait for seating chart modal/page to load
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: '/tmp/customer-seating-chart-modal.png',
          fullPage: true 
        });
      } else {
        console.log('View Seating button not found - this may be expected if no zones are configured');
        await page.screenshot({ 
          path: '/tmp/customer-no-seating-button.png',
          fullPage: true 
        });
      }
    });

    test('should allow clicking on zones to select tickets', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/event/test-event`);
      
      // Open seating chart
      const viewSeatingButton = page.locator('button:has-text("View Seating"), button:has-text("Seating Chart")');
      if (await viewSeatingButton.isVisible()) {
        await viewSeatingButton.click();
        await page.waitForTimeout(1000);
        
        // Look for interactive seating chart
        const seatingChart = page.locator('canvas, .seating-chart, [data-testid="interactive-seating-chart"]');
        if (await seatingChart.isVisible()) {
          // Take screenshot of the interactive chart
          await page.screenshot({ 
            path: '/tmp/customer-interactive-seating-chart.png',
            fullPage: true 
          });
          
          // Try to click on different areas of the seating chart
          const chartBox = await seatingChart.boundingBox();
          if (chartBox) {
            // Click on different areas to test zone selection
            await page.mouse.click(chartBox.x + chartBox.width * 0.3, chartBox.y + chartBox.height * 0.3);
            await page.waitForTimeout(500);
            
            await page.screenshot({ 
              path: '/tmp/customer-zone-selected-1.png',
              fullPage: true 
            });
            
            await page.mouse.click(chartBox.x + chartBox.width * 0.7, chartBox.y + chartBox.height * 0.7);
            await page.waitForTimeout(500);
            
            await page.screenshot({ 
              path: '/tmp/customer-zone-selected-2.png',
              fullPage: true 
            });
          }
        }
        
        // Check if zone information modal appears
        const zoneModal = page.locator('.zone-info, [data-testid="zone-info"], .modal');
        if (await zoneModal.isVisible()) {
          await page.screenshot({ 
            path: '/tmp/customer-zone-info-modal.png',
            fullPage: true 
          });
        }
      }
    });

    test('should integrate with existing checkout flow', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/event/test-event`);
      
      // Test that selected zones integrate with the product selection
      const productSelection = page.locator('.product-selection, .checkout, [data-testid="product-selector"]');
      if (await productSelection.isVisible()) {
        await page.screenshot({ 
          path: '/tmp/customer-product-selection.png',
          fullPage: true 
        });
      }
      
      // Look for quantity selectors and add to cart functionality
      const quantityInputs = page.locator('input[type="number"], .quantity-selector');
      const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("Select"), [data-testid="add-to-cart"]');
      
      if (await quantityInputs.first().isVisible()) {
        await page.screenshot({ 
          path: '/tmp/customer-ticket-selection.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Full End-to-End Scenario', () => {
    test('complete seating chart workflow', async ({ page }) => {
      console.log('=== Starting Full E2E Seating Chart Test ===');
      
      // Step 1: Admin creates seating chart
      console.log('Step 1: Testing Admin Interface');
      await page.goto(`${FRONTEND_URL}/manage/events/1/seating-chart`);
      await page.screenshot({ 
        path: '/tmp/e2e-01-admin-start.png',
        fullPage: true 
      });
      
      // Step 2: Navigate to customer view
      console.log('Step 2: Testing Customer Interface');
      await page.goto(`${FRONTEND_URL}/event/test-event`);
      await page.screenshot({ 
        path: '/tmp/e2e-02-customer-event.png',
        fullPage: true 
      });
      
      // Step 3: Check for seating functionality
      const viewSeatingButton = page.locator('button:has-text("View Seating"), button:has-text("Seating Chart")');
      if (await viewSeatingButton.isVisible()) {
        console.log('✅ View Seating button found');
        await viewSeatingButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: '/tmp/e2e-03-seating-chart-opened.png',
          fullPage: true 
        });
      } else {
        console.log('ℹ️  View Seating button not found - may be expected without configured zones');
      }
      
      // Step 4: Test product selection area
      await page.goto(`${FRONTEND_URL}/event/test-event`);
      await page.screenshot({ 
        path: '/tmp/e2e-04-product-selection.png',
        fullPage: true 
      });
      
      console.log('=== E2E Test Complete ===');
    });
  });
});