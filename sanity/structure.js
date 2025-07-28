// https://www.sanity.io/docs/structure-builder-cheat-sheet

import {
  AiFillHome,
  AiFillInfoCircle,
} from 'react-icons/ai';

const hiddenDocTypes = (listItem) =>
  !['homepage', 'about'].includes(listItem.getId());

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Homepage')
        .icon(AiFillHome) // Add an icon
        .child(
          S.editor()
            .id('singleton-homepage')
            .schemaType('homepage')
            .documentId('singleton-homepage')
        ),
      S.listItem()
        .title('About page')
        .icon(AiFillInfoCircle)
        .child(
          S.editor()
            .id('singleton-about')
            .schemaType('about')
            .documentId('singleton-about')
        ),
      ...S.documentTypeListItems().filter(hiddenDocTypes),
    ]);
