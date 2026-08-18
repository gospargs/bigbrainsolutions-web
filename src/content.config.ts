import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(1, 'Every page needs a non-empty meta description'),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages };
