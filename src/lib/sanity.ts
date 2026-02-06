import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Sanity client configuration
export const sanityClient = createClient({
  projectId: 'eulheo47',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})

// Image URL builder
const builder = imageUrlBuilder(sanityClient)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return builder.image(source).auto('format')
}

// Types
export interface PortfolioItem {
  _id: string
  title: string
  slug: { current: string }
  date: string
  category: string
  location: string
  description: string
  coverImage: any
  images: any[]
  featured: boolean
  order: number
}

// Queries
export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  return sanityClient.fetch(`
    *[_type == "portfolio"] | order(order asc, date desc) {
      _id,
      title,
      slug,
      date,
      category,
      location,
      description,
      coverImage,
      images,
      featured,
      order
    }
  `)
}

export async function getPortfolioItem(slug: string): Promise<PortfolioItem | null> {
  return sanityClient.fetch(`
    *[_type == "portfolio" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      date,
      category,
      location,
      description,
      coverImage,
      images,
      featured
    }
  `, { slug })
}

export async function getFeaturedPortfolio(): Promise<PortfolioItem[]> {
  return sanityClient.fetch(`
    *[_type == "portfolio" && featured == true] | order(order asc) [0...6] {
      _id,
      title,
      slug,
      coverImage,
      category
    }
  `)
}

export async function getLatestPortfolio(count: number = 3): Promise<PortfolioItem[]> {
  return sanityClient.fetch(`
    *[_type == "portfolio"] | order(date desc) [0...${count}] {
      _id,
      title,
      slug,
      date,
      category,
      coverImage
    }
  `)
}

// Category labels in Polish
export const categoryLabels: Record<string, string> = {
  'reportaz-slubny': 'Reportaż ślubny',
  'sesja-poslubna': 'Sesja poślubna',
  'sesja-narzeczenska': 'Sesja narzeczeńska',
}
