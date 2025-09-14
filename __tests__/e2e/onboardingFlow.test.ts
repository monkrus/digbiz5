/**
 * End-to-End Onboarding Flow Tests
 *
 * E2E tests for the complete onboarding flow from welcome screen
 * to completion, including all user interactions and state management.
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Onboarding Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to onboarding if not already there
    try {
      await element(by.id('start-onboarding-button')).tap();
    } catch (e) {
      // Might already be in onboarding
    }
  });

  describe('Welcome Screen', () => {
    it('should display welcome screen with app benefits', async () => {
      await detoxExpect(element(by.text('DigBiz'))).toBeVisible();
      await detoxExpect(
        element(by.text('Your Business Network Hub')),
      ).toBeVisible();
      await detoxExpect(
        element(by.text('Welcome to the Future of Business Networking')),
      ).toBeVisible();

      // Check app benefits are displayed
      await detoxExpect(element(by.text('Smart Networking'))).toBeVisible();
      await detoxExpect(
        element(by.text('Discover Opportunities')),
      ).toBeVisible();
      await detoxExpect(element(by.text('Industry Insights'))).toBeVisible();
      await detoxExpect(element(by.text('Join Communities'))).toBeVisible();

      // Check stats section
      await detoxExpect(element(by.text('10K+'))).toBeVisible();
      await detoxExpect(element(by.text('Active Users'))).toBeVisible();
    });

    it('should navigate to user type selection on get started', async () => {
      await element(by.id('get-started-button')).tap();

      await waitFor(element(by.text('What describes you best?')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should allow skipping onboarding', async () => {
      await element(by.id('skip-button')).tap();

      // Should navigate to main app
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('User Type Selection', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
    });

    it('should display user type options with descriptions', async () => {
      await detoxExpect(element(by.text('Founder'))).toBeVisible();
      await detoxExpect(
        element(by.text('Building and leading a company')),
      ).toBeVisible();

      await detoxExpect(element(by.text('Investor'))).toBeVisible();
      await detoxExpect(
        element(by.text('Investing in startups and companies')),
      ).toBeVisible();

      await detoxExpect(element(by.text('Professional'))).toBeVisible();
      await detoxExpect(
        element(by.text('Working as an employee or consultant')),
      ).toBeVisible();
    });

    it('should expand user type card to show benefits', async () => {
      await element(by.id('expand-founder-card')).tap();

      await detoxExpect(element(by.text("What you'll get:"))).toBeVisible();
      await detoxExpect(
        element(by.text('Connect with investors and advisors')),
      ).toBeVisible();
      await detoxExpect(
        element(by.text('Find co-founders and key talent')),
      ).toBeVisible();
    });

    it('should select founder and proceed to industry selection', async () => {
      await element(by.id('user-type-founder')).tap();
      await detoxExpect(element(by.id('continue-button'))).toBeVisible();

      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should select investor and proceed', async () => {
      await element(by.id('user-type-investor')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should select professional and proceed', async () => {
      await element(by.id('user-type-employee')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should disable continue button without selection', async () => {
      await detoxExpect(
        element(by.id('continue-button').and(by.traits(['disabled']))),
      ).toBeVisible();
    });

    it('should navigate back to welcome screen', async () => {
      await element(by.id('back-button')).tap();

      await waitFor(element(by.text('DigBiz')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Industry Selection', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
    });

    it('should display industry search and categories', async () => {
      await detoxExpect(element(by.id('industry-search-input'))).toBeVisible();
      await detoxExpect(element(by.text('Technology'))).toBeVisible();
      await detoxExpect(element(by.text('Finance & Fintech'))).toBeVisible();
      await detoxExpected(
        element(by.text('Healthcare & Life Sciences')),
      ).toBeVisible();
    });

    it('should search for industries', async () => {
      await element(by.id('industry-search-input')).typeText('software');

      await waitFor(element(by.text('Software & SaaS')))
        .toBeVisible()
        .withTimeout(2000);

      await detoxExpect(
        element(by.text('Artificial Intelligence & Machine Learning')),
      ).toBeVisible();
    });

    it('should filter by category', async () => {
      await element(by.text('Technology')).tap();

      await detoxExpect(element(by.text('Software & SaaS'))).toBeVisible();
      await detoxExpect(
        element(by.text('Artificial Intelligence & Machine Learning')),
      ).toBeVisible();
      await detoxExpect(element(by.text('Cybersecurity'))).toBeVisible();
    });

    it('should show popular industries for founders', async () => {
      await detoxExpected(
        element(by.text('Popular for founders')),
      ).toBeVisible();
      await detoxExpected(element(by.text('Software & SaaS'))).toBeVisible();
    });

    it('should select industry and proceed to location setup', async () => {
      await element(by.text('Software & SaaS')).tap();
      await detoxExpected(element(by.id('continue-button'))).toBeVisible();

      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text('Where are you located?')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should clear search and show all categories', async () => {
      await element(by.id('industry-search-input')).typeText('software');
      await element(by.id('clear-search-button')).tap();

      await detoxExpected(element(by.text('Technology'))).toBeVisible();
      await detoxExpected(element(by.text('Finance & Fintech'))).toBeVisible();
    });
  });

  describe('Location Setup', () => {
    beforeEach(async () => {
      // Navigate through previous steps
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
    });

    it('should display location detection option', async () => {
      await detoxExpected(
        element(by.text('Use my current location')),
      ).toBeVisible();
      await detoxExpected(
        element(by.id('detect-location-button')),
      ).toBeVisible();
    });

    it('should search for locations', async () => {
      await element(by.id('location-search-input')).typeText('San Francisco');

      await waitFor(element(by.text('San Francisco, United States')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should detect current location', async () => {
      await element(by.id('detect-location-button')).tap();

      await waitFor(element(by.text('Detecting location...')))
        .toBeVisible()
        .withTimeout(1000);

      // Should auto-advance to timezone step after detection
      await waitFor(element(by.text('Select your timezone')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should select location manually and proceed to timezone', async () => {
      await element(by.text('San Francisco, United States')).tap();
      await element(by.id('next-button')).tap();

      await waitFor(element(by.text('Select your timezone')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should skip location setup', async () => {
      await element(by.id('skip-button')).tap();

      await waitFor(element(by.text('Enable permissions')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Timezone Selection', () => {
    beforeEach(async () => {
      // Navigate to timezone step
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
      await element(by.text('San Francisco, United States')).tap();
      await element(by.id('next-button')).tap();
      await waitFor(element(by.text('Select your timezone'))).toBeVisible();
    });

    it('should display timezone options', async () => {
      await detoxExpected(element(by.text('Pacific Time (PST)'))).toBeVisible();
      await detoxExpected(element(by.text('Eastern Time (EST)'))).toBeVisible();
      await detoxExpected(element(by.text('Central Time (CST)'))).toBeVisible();
    });

    it('should search for timezones', async () => {
      await element(by.id('timezone-search-input')).typeText('pacific');

      await waitFor(element(by.text('Pacific Time (PST)')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should select timezone and proceed to permissions', async () => {
      await element(by.text('Pacific Time (PST)')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text('Enable permissions')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show selected location summary', async () => {
      await detoxExpected(element(by.text('Selected Location'))).toBeVisible();
      await detoxExpected(
        element(by.text('San Francisco, United States')),
      ).toBeVisible();
    });
  });

  describe('Permission Requests', () => {
    beforeEach(async () => {
      // Navigate to permissions step
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
      await element(by.text('San Francisco, United States')).tap();
      await element(by.id('next-button')).tap();
      await waitFor(element(by.text('Select your timezone'))).toBeVisible();
      await element(by.text('Pacific Time (PST)')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Enable permissions'))).toBeVisible();
    });

    it('should display permission cards with descriptions', async () => {
      await detoxExpected(element(by.text('Push Notifications'))).toBeVisible();
      await detoxExpected(
        element(
          by.text(
            'Get notified about new connections, messages, and opportunities',
          ),
        ),
      ).toBeVisible();

      await detoxExpected(element(by.text('Contacts Access'))).toBeVisible();
      await detoxExpected(
        element(by.text('Find people you know and invite them to connect')),
      ).toBeVisible();

      await detoxExpected(element(by.text('Location Services'))).toBeVisible();
      await detoxExpected(element(by.text('Camera Access'))).toBeVisible();
    });

    it('should request individual permissions', async () => {
      await element(by.id('allow-notifications-button')).tap();

      // Permission dialog might appear (handled by system)
      await waitFor(element(by.id('notifications-granted-icon')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should request all permissions at once', async () => {
      await element(by.id('allow-all-button')).tap();

      // Should show progress indicator
      await waitFor(element(by.text('Requesting...')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should skip permissions and proceed to completion', async () => {
      await element(by.id('skip-permissions-button')).tap();

      await waitFor(element(by.text("You're all set!")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show permission progress counter', async () => {
      await detoxExpected(
        element(by.text('0 of 4 permissions granted')),
      ).toBeVisible();

      await element(by.id('allow-notifications-button')).tap();
      await waitFor(element(by.text('1 of 4 permissions granted')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should display permission benefits section', async () => {
      await detoxExpected(
        element(by.text('Why we need these permissions')),
      ).toBeVisible();
      await detoxExpected(
        element(by.text('Your privacy is protected')),
      ).toBeVisible();
      await detoxExpected(
        element(by.text('You can change these permissions anytime')),
      ).toBeVisible();
    });
  });

  describe('Completion Screen', () => {
    beforeEach(async () => {
      // Complete full onboarding flow
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();
      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
      await element(by.text('San Francisco, United States')).tap();
      await element(by.id('next-button')).tap();
      await waitFor(element(by.text('Select your timezone'))).toBeVisible();
      await element(by.text('Pacific Time (PST)')).tap();
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text('Enable permissions'))).toBeVisible();
      await element(by.id('skip-permissions-button')).tap();
      await waitFor(element(by.text("You're all set!"))).toBeVisible();
    });

    it('should display completion message with user data', async () => {
      await detoxExpected(element(by.text("You're all set!"))).toBeVisible();
      await detoxExpected(
        element(
          by.text(
            'Welcome, founder! Ready to build connections in Software & SaaS?',
          ),
        ),
      ).toBeVisible();
    });

    it('should show profile summary', async () => {
      await detoxExpected(
        element(by.text('Your Profile Summary')),
      ).toBeVisible();
      await detoxExpected(element(by.text('Role'))).toBeVisible();
      await detoxExpected(element(by.text('Founder'))).toBeVisible();
      await detoxExpected(element(by.text('Industry'))).toBeVisible();
      await detoxExpected(element(by.text('Software & SaaS'))).toBeVisible();
      await detoxExpected(element(by.text('Location'))).toBeVisible();
      await detoxExpected(
        element(by.text('San Francisco, United States')),
      ).toBeVisible();
    });

    it('should show personalized next steps', async () => {
      await detoxExpected(element(by.text("What's next?"))).toBeVisible();
      await detoxExpected(
        element(by.text('Create your company profile')),
      ).toBeVisible();
      await detoxExpected(
        element(by.text('Connect with potential investors')),
      ).toBeVisible();
      await detoxExpected(
        element(by.text('Join founder communities')),
      ).toBeVisible();
    });

    it('should navigate to main app on completion', async () => {
      await element(by.id('start-networking-button')).tap();

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should display success animation', async () => {
      await detoxExpected(element(by.id('success-checkmark'))).toBeVisible();
    });
  });

  describe('Full Flow Variations', () => {
    it('should complete onboarding as investor', async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();

      await element(by.id('user-type-investor')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Financial Technology')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
      await element(by.text('New York, United States')).tap();
      await element(by.id('next-button')).tap();

      await waitFor(element(by.text('Select your timezone'))).toBeVisible();
      await element(by.text('Eastern Time (EST)')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text('Enable permissions'))).toBeVisible();
      await element(by.id('allow-all-button')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(
        element(
          by.text(
            'Welcome, investor! Discover opportunities in Financial Technology.',
          ),
        ),
      )
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should complete minimal onboarding flow', async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();

      await element(by.id('user-type-employee')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();
      await element(by.id('continue-button')).tap();

      // Skip location
      await waitFor(element(by.text('Where are you located?'))).toBeVisible();
      await element(by.id('skip-button')).tap();

      // Skip permissions
      await waitFor(element(by.text('Enable permissions'))).toBeVisible();
      await element(by.id('skip-permissions-button')).tap();

      await waitFor(element(by.text("You're all set!")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Navigation and State Persistence', () => {
    it('should preserve state when navigating back and forth', async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();

      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();

      await waitFor(element(by.text("What's your industry?"))).toBeVisible();
      await element(by.text('Software & SaaS')).tap();

      // Go back to user type
      await element(by.id('back-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();

      // Founder should still be selected
      await detoxExpected(
        element(by.id('user-type-founder').and(by.traits(['selected']))),
      ).toBeVisible();

      // Go forward again
      await element(by.id('continue-button')).tap();
      await waitFor(element(by.text("What's your industry?"))).toBeVisible();

      // Software & SaaS should still be selected
      await detoxExpected(
        element(by.text('Software & SaaS').and(by.traits(['selected']))),
      ).toBeVisible();
    });

    it('should handle app backgrounding and restoration', async () => {
      await element(by.id('get-started-button')).tap();
      await waitFor(element(by.text('What describes you best?'))).toBeVisible();

      await element(by.id('user-type-founder')).tap();
      await element(by.id('continue-button')).tap();

      // Background and restore app
      await device.sendToHome();
      await device.launchApp();

      // Should return to same state
      await waitFor(element(by.text("What's your industry?")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });
});
