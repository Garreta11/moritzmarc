// https://www.sanity.io/docs/structure-builder-cheat-sheet

import {
  AiFillHome,
} from 'react-icons/ai';

const hiddenDocTypes = (listItem) =>
  !['homepage'].includes(listItem.getId());

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
      ...S.documentTypeListItems().filter(hiddenDocTypes),
    ]);
