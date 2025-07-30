import { defineType, defineField } from 'sanity';
import { EarthGlobeIcon } from '@sanity/icons';

export const homeType = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  icon: EarthGlobeIcon,
  fields: [
    /* defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }), */
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      title: 'Hero',
      name: 'hero',
      type: 'file',
      description: 'Background Video for Homepage',
    }),
    defineField({
      title: 'Hero Mobile',
      name: 'heromobile',
      type: 'file',
      description: 'Background Video for Homepage Mobile',
    }),
    defineField({
      name: 'partnershipText',
      title: 'Partnership Text',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Text like "A CREATIVE PARTNERSHIP BY..."',
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      description: 'Email like "reach@marcmoritz.com"',
    }),
    defineField({
      name: 'slogan',
      title: 'Slogan',
      type: 'string',
      description: 'E.g. "CRAFTING STORIES, VISUALS AND MEANING"',
    }),
    defineField({
      name: 'location',
      title: 'Location Text',
      type: 'string',
      description: 'E.g. "BASED IN PARIS AND BARCELONA — OPERATING WORLDWIDE"',
    }),
  ],
});
