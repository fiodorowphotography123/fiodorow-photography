import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'report',
    title: 'Reportaże',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Tytuł',
            type: 'string',
            description: 'Nazwa pary, np. "Anna & Tomek"',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'date',
            title: 'Data ślubu',
            type: 'date',
            options: {
                dateFormat: 'DD MMMM YYYY',
            },
        }),
        defineField({
            name: 'venue',
            title: 'Miejsce wesela',
            type: 'string',
            description: 'Nazwa sali weselnej',
        }),
        defineField({
            name: 'location',
            title: 'Lokalizacja',
            type: 'string',
            description: 'Miasto/region',
        }),
        defineField({
            name: 'excerpt',
            title: 'Krótki opis',
            type: 'text',
            rows: 3,
            description: 'Wyświetlany na liście reportaży',
        }),
        defineField({
            name: 'story',
            title: 'Historia',
            type: 'array',
            of: [{ type: 'block' }],
            description: 'Pełna historia dnia ślubu',
        }),
        defineField({
            name: 'coverImage',
            title: 'Zdjęcie główne',
            type: 'image',
            options: {
                hotspot: true,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'images',
            title: 'Galeria zdjęć',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: {
                        hotspot: true,
                    },
                    fields: [
                        {
                            name: 'caption',
                            type: 'string',
                            title: 'Podpis',
                        },
                    ],
                },
            ],
        }),
        defineField({
            name: 'featured',
            title: 'Wyróżniony',
            type: 'boolean',
            description: 'Pokaż na stronie głównej',
            initialValue: false,
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'venue',
            media: 'coverImage',
        },
    },
    orderings: [
        {
            title: 'Data (najnowsze)',
            name: 'dateDesc',
            by: [{ field: 'date', direction: 'desc' }],
        },
    ],
})
