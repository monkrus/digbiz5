# Business Card Schema Documentation

## Overview

The business card schema is designed to be comprehensive, flexible, and extensible, supporting everything from basic contact information to complex startup data and networking features.

## Core Components

### 1. Basic Information (`BasicInfo`)

Required fields for every business card:

```typescript
interface BasicInfo {
  name: string; // Full name (required)
  title: string; // Job title (required)
  company: string; // Company name (required)
  email: string; // Email address (required)
  phone?: string; // Phone number (optional)
  location?: string; // Geographic location (optional)
  bio?: string; // Personal/professional bio (optional)
  profilePhoto?: string; // Profile photo URL (optional)
  companyLogo?: string; // Company logo URL (optional)
}
```

### 2. Startup-Specific Fields (`StartupInfo`)

Extended information for startup founders and employees:

```typescript
interface StartupInfo {
  fundingStage: FundingStage; // Current funding stage
  fundingAmount?: string; // Amount raised
  fundingRound?: string; // Round details
  teamSize: TeamSize; // Current team size
  foundedYear?: number; // Year founded
  industry: string[]; // Industry categories
  businessModel?: BusinessModel; // Business model type
  revenue?: RevenueStage; // Revenue stage
  customers?: string; // Customer metrics
  growth?: string; // Growth metrics

  // What they're looking for
  seekingFunding?: boolean;
  seekingTalent?: boolean;
  seekingPartners?: boolean;
  seekingMentors?: boolean;
}
```

**Funding Stages:**

- `idea` - Just an idea
- `pre-seed` - Pre-seed funding
- `seed` - Seed funding
- `series-a` through `series-d+` - Series funding rounds
- `ipo` - Public company
- `acquired` - Acquired company
- `bootstrapped` - Self-funded

**Team Sizes:**

- `solo` - Solo founder
- `2-5`, `6-10`, `11-25`, `26-50`, `51-100`, `101-250`, `250+`

### 3. Social Links (`SocialLinks`)

Comprehensive social media and professional platform support:

```typescript
interface SocialLinks {
  // Professional networks
  linkedin?: string;
  twitter?: string;
  website?: string;

  // Development platforms
  github?: string;
  gitlab?: string;
  stackoverflow?: string;

  // Social media
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;

  // Messaging platforms
  telegram?: string;
  whatsapp?: string;
  discord?: string;
  slack?: string;

  // Creative platforms
  medium?: string;
  behance?: string;
  dribbble?: string;
  producthunt?: string;
  angellist?: string;
  crunchbase?: string;
}
```

### 4. Custom Fields (`CustomField`)

Flexible system for additional information:

```typescript
interface CustomField {
  id: string;
  label: string; // Field label
  value: string; // Field value
  type: CustomFieldType; // Field type for validation
  icon?: string; // Optional icon
  isPublic: boolean; // Visibility setting
  order: number; // Display order
}
```

**Field Types:**

- `text` - Plain text
- `url` - Website/link
- `email` - Email address
- `phone` - Phone number
- `number` - Numeric value
- `date` - Date value
- `boolean` - True/false
- `select` - Single choice
- `multiselect` - Multiple choices

### 5. Card Themes (`CardTheme`)

Visual styling system:

```typescript
interface CardTheme {
  id: string;
  name: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Typography
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;

  // Layout
  borderRadius: number;
  padding: number;
  spacing: number;

  // Effects (optional)
  shadow?: ShadowStyle;
  gradient?: GradientStyle;
  pattern?: PatternStyle;
}
```

### 6. Card Templates (`CardTemplate`)

Layout and element positioning:

```typescript
interface CardTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  layout: LayoutStyle;
  elements: TemplateElement[];
  isPopular: boolean;
  isPremium: boolean;
  previewImage: string;
}
```

**Template Categories:**

- `minimalist` - Clean, simple designs
- `professional` - Traditional business layouts
- `creative` - Artistic and unique designs
- `startup` - Modern, innovation-focused
- `tech` - Technology and developer-oriented
- `corporate` - Formal corporate styles
- `artistic` - Creative and expressive

## Predefined Themes

### Professional Themes

- **Professional Blue** - Classic blue with clean typography
- **Professional Gray** - Neutral gray with subtle styling

### Startup Themes

- **Startup Gradient** - Purple-blue gradient with modern fonts
- **Modern Startup** - Green accent with contemporary design

### Creative Themes

- **Creative Vibrant** - Bold red with artistic patterns
- **Creative Dark** - Dark background with bright accents

### Minimalist Themes

- **Minimalist White** - Pure white with black text
- **Minimalist Mono** - Monospace font with minimal styling

### Tech Themes

- **Tech Neon** - Dark theme with cyan glow effects
- **Tech Matrix** - Green-on-black matrix style

### Corporate Themes

- **Corporate Navy** - Navy blue professional theme
- **Corporate Burgundy** - Burgundy traditional theme

## Predefined Templates

### Standard Professional

- Profile photo, name, title, company
- Contact information below
- Social links at bottom

### Minimalist Clean

- Centered text layout
- Minimal visual elements
- Clean typography

### Startup Founder

- Company logo prominent
- Bio section included
- QR code for easy sharing

### Creative Artistic

- Asymmetric layout
- Artistic visual elements
- Bold typography

### Tech Developer

- Code-style fonts
- Technical aesthetic
- GitHub/portfolio links emphasized

### Corporate Executive

- Formal layout
- Company branding
- Traditional structure

## Validation Rules

### Required Fields

- Name (2-50 characters)
- Title (2-100 characters)
- Company (2-100 characters)
- Email (valid email format)

### Optional Field Limits

- Phone (7-20 characters, valid format)
- Bio (10-500 characters)
- Location (max 100 characters)
- Custom fields (max 10 per card)

### Social Link Validation

Each platform has specific URL pattern validation to ensure links are properly formatted.

## Advanced Features

### Card Sharing

- Generate unique share codes
- QR code generation
- Analytics tracking
- View history

### Networking

- Card exchange tracking
- Networking event integration
- Contact list management
- Exchange confirmation

### Analytics

- View counts and history
- Engagement metrics
- Popular content tracking
- Geographic insights

### Export/Import

- Multiple format support (PDF, PNG, vCard)
- QR code inclusion
- Analytics data export
- Import from standard formats

## Usage Examples

### Creating a Basic Business Card

```typescript
const basicCard: BusinessCardFormData = {
  basicInfo: {
    name: 'John Doe',
    title: 'Software Engineer',
    company: 'Tech Corp',
    email: 'john@techcorp.com',
    phone: '+1-555-0123',
    bio: 'Passionate about building great software',
  },
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
  },
  customFields: [],
  themeId: 'professional-blue',
  templateId: 'standard-professional',
};
```

### Creating a Startup Founder Card

```typescript
const startupCard: BusinessCardFormData = {
  basicInfo: {
    name: 'Jane Smith',
    title: 'Co-Founder & CEO',
    company: 'InnovateTech',
    email: 'jane@innovatetech.com',
  },
  startupInfo: {
    fundingStage: 'seed',
    teamSize: '6-10',
    industry: ['fintech', 'ai'],
    businessModel: 'saas',
    seekingFunding: true,
    seekingTalent: true,
  },
  socialLinks: {
    linkedin: 'https://linkedin.com/in/janesmith',
    twitter: 'https://twitter.com/janesmith',
    crunchbase: 'https://crunchbase.com/organization/innovatetech',
  },
  customFields: [
    {
      id: '1',
      label: 'Pitch Deck',
      value: 'https://deck.innovatetech.com',
      type: 'url',
      isPublic: true,
      order: 1,
    },
  ],
  themeId: 'startup-gradient',
  templateId: 'startup-founder',
};
```

## Future Extensibility

The schema is designed to be easily extensible:

1. **Custom Field Types** - Add new field types as needed
2. **Theme Properties** - Extend themes with new visual properties
3. **Template Elements** - Add new element types to templates
4. **Social Platforms** - Easy to add new social platforms
5. **Startup Fields** - Extend startup info with new metrics
6. **Export Formats** - Add support for new export formats

This comprehensive schema provides a solid foundation for a feature-rich business card application while maintaining flexibility for future enhancements.
