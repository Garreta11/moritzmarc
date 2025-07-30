import { client } from './configSanity';
import { groq } from 'next-sanity';

// Home Page
export async function getHomepage(id) {
  const query = groq`
    *[_type == "homepage" && _id == $id][0] {
      _id,
      _createdAt,
      title,
      "hero": hero.asset->url,
      "heromobile": heromobile.asset->url,
      partnershipText,
      email,
      slogan,
      location
    }
  `;

  const data = await client.fetch(query, { id });
  return data;
}

// Work Page
/* export async function getWorkpage(id) {
  const query = groq`
    *[_type == "work" && _id == $id][0] {
      _id,
      _createdAt,
      title,
    }
  `;

  const data = await client.fetch(query, { id });
  return data;
} */

// About Page
export async function getAboutpage(id) {
  const query = groq`
    *[_type == "about" && _id == $id][0] {
      _id,
      _createdAt,
      title,
      description,
      "profile":profilepicture.asset->url,
      items[] {
        title,
        number
      }
    }
  `;

  const data = await client.fetch(query, { id });
  return data;
}

// Get Selected Projects
/* export async function getSelectedProjects(id) {
  const query = groq`
    *[_type == "selectedProjects" && _id == $id][0] {
      _id,
      _createdAt,
      title,
      projects[]->{
        _id,
        title,
        client,
        category,
        "slug": slug.current,
        "heroUrl": hero.asset->url, // Example of fetching asset URL,
        "thumbnailUrl": thumbnail.asset->url
      }
    }
  `;

  const data = await client.fetch(query, { id });
  return data;
} */

// Single Project
/* export async function getProject(slug) {
  const query = groq`
      *[_type == 'projects' && slug.current == $slug][0] {
        _id,
        _createdAt,
        title,
        client,
        category,
        "heroUrl": hero.asset->url,
        "fullvideoUrl": fullvideo.asset->url,
        credits,
        pageBuilder[] {
          ...,
          _type == "imageBlock" => {
            "imageUrl": image.asset->url
          },
          _type == "textBlock" => {
            text
          },
          _type == "videoBlock" => {
            "videoUrl": video.asset->url
          }
        },
        // Get the previous and next projects based on creation date (_createdAt)
        "prevProject": *[_type == 'projects' && _createdAt < ^._createdAt] | order(_createdAt desc)[0] {
          _id,
          title,
          client,
          slug,
          "heroUrl": hero.asset->url,
          "thumbnailUrl": thumbnail.asset->url
        },
        "nextProject": *[_type == 'projects' && _createdAt > ^._createdAt] | order(_createdAt asc)[0] {
          _id,
          title,
          client,
          slug,
          "heroUrl": hero.asset->url,
          "thumbnailUrl": thumbnail.asset->url
        },
        // Get the first and last project for looping
        "firstProject": *[_type == 'projects'] | order(_createdAt asc)[0] {
          _id,
          title,
          client,
          slug,
          "heroUrl": hero.asset->url,
          "thumbnailUrl": thumbnail.asset->url
        },
        "lastProject": *[_type == 'projects'] | order(_createdAt desc)[0] {
          _id,
          title,
          client,
          slug,
          "heroUrl": hero.asset->url,
          "thumbnailUrl": thumbnail.asset->url
        }
      }`;

  const data = await client.fetch(query, { slug });

  // Handle looping when the project is the first or last
  const prevProject = data.prevProject || data.lastProject;
  const nextProject = data.nextProject || data.firstProject;

  return {
    ...data,
    prevProject,
    nextProject,
  };
} */

// All Projects List
export async function getProjectsList() {
  const query = groq`
    *[_type == 'projects'] | order(order asc){
      _id,
      _createdAt,
      name,
      description,
      "image": image.asset->url
    }`;
  const data = await client.fetch(query);
  return data;
}

// Fetch all unique categories from projects
/* export async function getAllCategories() {
  const query = groq`
    *[_type == 'projects'].category
  `;
  const categories = await client.fetch(query);

  // Flatten and remove duplicates
  const uniqueCategories = [...new Set(categories.flat())];

  return uniqueCategories;
} */

// All Studio Projects
/* export async function getStudioProjects() {
  const query = groq`
    *[_type == 'studio'] | order(order asc){
      _id,
      _createdAt,
      title,
      "slug": slug.current,
      "thumbnailUrl": thumbnail.asset->url
    }`;
  const data = await client.fetch(query);
  return data;
} */

// Single Studio Project
/* export async function getStudioProject(slug) {
  const query = groq`
    *[_type == 'studio' && slug.current == $slug][0] {
      _id,
      _createdAt,
      title,
      client,
      type,
      "slug": slug.current,
      "thumbnailUrl": thumbnail.asset->url,
      "audioUrl": audio.asset->url,
      descriptions[]{
        text
      },
      images[]{
        "imageUrl": image.asset->url
      }
    }`;

  const data = await client.fetch(query, { slug });
  return data;
}
 */