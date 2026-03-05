<template>
  <NuxtPage />
</template>

<script setup>
import { onMounted } from 'vue';
import posthog from 'posthog-js';

const config = useRuntimeConfig();
const router = useRouter();

if (process.client) {
  posthog.init(config.public.posthogKey, {
    api_host: config.public.posthogHost,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

useHead({
  title: 'Slate - Markdown editor with GitHub sync',
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'A minimal local-first markdown editor with GitHub sync. Write, edit, and sync your content.' },
    { name: 'keywords', content: 'markdown editor, note taking, content creation, local first, privacy focused, GitHub sync' },
    { name: 'author', content: 'Kiran Johns' },

    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://slate.ink' },
    { property: 'og:title', content: 'Slate - Markdown editor with GitHub sync' },
    { property: 'og:description', content: 'A minimal local-first markdown editor with GitHub sync. Write, edit, and sync your content.' },
    { property: 'og:image', content: 'https://slate.ink/og-image.png' },
    { property: 'og:site_name', content: 'Slate' },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:url', content: 'https://slate.ink' },
    { name: 'twitter:title', content: 'Slate - Markdown editor with GitHub sync' },
    { name: 'twitter:description', content: 'A minimal local-first markdown editor with GitHub sync. Write, edit, and sync your content.' },
    { name: 'twitter:image', content: 'https://slate.ink/og-image.png' },
    { name: 'twitter:creator', content: '@thetronjohnson' },

    { name: 'format-detection', content: 'telephone=no' },
    { name: 'theme-color', content: '#ffffff' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/icon.png' },
    { rel: 'apple-touch-icon', href: '/icon.png' },
    { rel: 'canonical', href: 'https://slate.ink' }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': 'https://slate.ink/#webapp',
            name: 'Slate',
            url: 'https://slate.ink',
            description: 'A minimal local-first markdown editor with GitHub sync. Write, edit, and sync your content.',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            author: {
              '@type': 'Person',
              name: 'Kiran Johns',
              url: 'https://x.com/thetronjohnson'
            },
            featureList: [
              'Rich text editing',
              'Markdown export',
              'PDF export',
              'GitHub sync',
              'Local-first storage'
            ]
          },
          {
            '@type': 'Organization',
            '@id': 'https://slate.ink/#organization',
            name: 'Slate',
            url: 'https://slate.ink',
            logo: 'https://slate.ink/icon.png',
            sameAs: [
              'https://github.com/thetronjohnson/slate',
              'https://x.com/thetronjohnson'
            ]
          },
          {
            '@type': 'SoftwareApplication',
            '@id': 'https://slate.ink/#software',
            name: 'Slate',
            applicationCategory: 'WritingApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              ratingCount: '1'
            }
          }
        ]
      })
    }
  ]
});

onMounted(() => {
  if (process.client) {
    router.afterEach((to, from) => {
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = {};

      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          utmParams[param] = value;
        }
      });

      posthog.capture('$pageview', {
        $current_url: window.location.href,
        path: to.path,
        ...utmParams,
        referrer: document.referrer || 'direct',
        ...(Object.keys(utmParams).length > 0 && {
          $set: utmParams
        })
      });
    });
  }
});
</script> 