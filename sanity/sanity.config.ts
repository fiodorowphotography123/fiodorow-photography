import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

// Sanity project configuration
const projectId = 'eulheo47'
const dataset = 'production'

export default defineConfig({
    name: 'fiodorow-photography',
    title: 'Fiodorow Photography',

    projectId,
    dataset,

    plugins: [
        structureTool(),
        visionTool(),
    ],

    schema: {
        types: schemaTypes,
    },

    // Polish language for the studio
    document: {
        newDocumentOptions: (prev) => prev,
    },
})
