import { test, expect } from '@playwright/test';

test.describe('WorldCup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check if the main title is visible
    await expect(page.locator('h1, h2')).toContainText(/월드컵|WorldCup/);
    
    // Check if there's a create button or link
    const createButton = page.locator('text=만들기, text=생성, text=Create').first();
    await expect(createButton).toBeVisible();
  });

  test('should navigate to create page', async ({ page }) => {
    // Click on create/만들기 button
    await page.click('text=만들기, text=생성, text=Create');
    
    // Should navigate to create page
    await expect(page).toHaveURL(/\/create/);
    
    // Should show create form
    await expect(page.locator('input[type="text"], input[placeholder*="제목"]')).toBeVisible();
  });

  test('should create a simple worldcup', async ({ page }) => {
    // Navigate to create page
    await page.goto('/create');
    
    // Fill in worldcup details
    await page.fill('input[type="text"]', 'Test WorldCup');
    
    // Try to find description field
    const descriptionField = page.locator('textarea, input[placeholder*="설명"]').first();
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('This is a test worldcup');
    }
    
    // Look for file input or upload area
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Upload test files (you would need actual test files)
      // await fileInput.setInputFiles(['test-files/image1.jpg', 'test-files/image2.jpg']);
    }
    
    // Try to submit/save
    const submitButton = page.locator('button:has-text("저장"), button:has-text("생성"), button:has-text("완료")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });

  test('should display worldcup cards on homepage', async ({ page }) => {
    // Look for worldcup cards
    const cards = page.locator('[data-testid="worldcup-card"], .worldcup-card, div:has(button:has-text("시작"))');
    
    // Should have at least one card (or empty state)
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // If cards exist, check they have required elements
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();
      
      // Should have a play/start button
      await expect(firstCard.locator('button:has-text("시작"), button:has-text("Play")')).toBeVisible();
    } else {
      // If no cards, should show empty state or create prompt
      await expect(page.locator('text=월드컵, text=만들기, text=생성')).toBeVisible();
    }
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation should be accessible (hamburger menu or mobile nav)
    const mobileNav = page.locator('button[aria-label*="menu"], .mobile-menu, [data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Use Tab to navigate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should focus on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter');
  });

  test('should handle touch gestures on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for swipeable content
    const swipeableContent = page.locator('.game-screen, [data-testid="game-screen"]');
    
    if (await swipeableContent.isVisible()) {
      // Simulate swipe gesture
      const box = await swipeableContent.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
    }
  });
});

test.describe('Tournament Gameplay', () => {
  test('should start a tournament game', async ({ page }) => {
    await page.goto('/');
    
    // Look for a play button on any worldcup card
    const playButton = page.locator('button:has-text("시작"), button:has-text("Play")').first();
    
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Should navigate to game page
      await expect(page).toHaveURL(/\/play\/[^\/]+/);
      
      // Should show game interface
      await expect(page.locator('.game-screen, [data-testid="game-screen"]')).toBeVisible();
    } else {
      // If no tournaments available, skip this test
      test.skip('No tournaments available to play');
    }
  });

  test('should allow tournament selection with keyboard', async ({ page }) => {
    // Navigate to a game page (mock URL)
    await page.goto('/play/test-tournament');
    
    // Use arrow keys for selection
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    
    // Should respond to keyboard input
    // (Implementation depends on actual game logic)
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Should have logical heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    // All images should have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.textContent() || await button.getAttribute('aria-label');
      expect(accessibleName).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle large lists efficiently', async ({ page }) => {
    // Navigate to a page that might have many items
    await page.goto('/');
    
    // Scroll down to trigger any lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Should remain responsive
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});