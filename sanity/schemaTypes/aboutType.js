import { defineType, defineField, defineArrayMember } from 'sanity';
import { PlayIcon } from '@sanity/icons';

export const aboutType = defineType({
  name: 'about',
  title: 'About page',
  type: 'document',
  icon: PlayIcon,
  fieldsets: [
    {
      name: 'topRow',
      title: 'About Settings',
      options: { columns: 2 },
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      fieldset: 'topRow',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
      fieldset: 'topRow',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
});
