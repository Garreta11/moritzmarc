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
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
});
