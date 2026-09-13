import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ArticleShell } from "@/components/article-shell";
import { RichText } from "@/components/rich-text";
import { site } from "@/content/site";
import { POST_CATEGORY_LABEL } from "@/lib/db-types";
import { canOptimizeImage } from "@/lib/images";
import { getPostBySlug, summarize } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

// Dirender saat pertama dibuka lalu disimpan; admin panel memperbaruinya lewat revalidatePath.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

const loadPost = cache(getPostBySlug);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return { title: "News tidak ditemukan" };

  const description = post.excerpt || summarize(post.body, 160);
  const url = `/news/${post.slug}`;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const post = await loadPost((await params).slug);
  if (!post) notFound();

  const published = post.published_at ?? post.created_at;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.category === "artikel" ? "Article" : "NewsArticle",
    headline: post.title,
    datePublished: published,
    dateModified: post.updated_at,
    image: post.cover_url ? [post.cover_url] : undefined,
    author: { "@type": "Organization", name: post.author || site.name },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/news/${post.slug}`,
  };

  return (
    <ArticleShell>
      <article className="px-5 pt-12 pb-20 sm:px-8 sm:pt-16 lg:pb-28">
        <header className="mx-auto max-w-3xl">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md bg-navy-700 px-2 py-0.5 font-semibold text-cream-100">
              {POST_CATEGORY_LABEL[post.category]}
            </span>
            <time dateTime={published} className="text-ink-soft">
              {formatDate(published)}
            </time>
            {post.author && <span className="text-ink-soft">· {post.author}</span>}
          </p>
          <h1 className="text-headline mt-4 font-bold text-balance">{post.title}</h1>
          {post.excerpt && <p className="text-lead mt-5 text-pretty text-ink-soft">{post.excerpt}</p>}
        </header>

        {post.cover_url && (
          <div className="relative mx-auto mt-10 aspect-1200/630 max-w-5xl overflow-hidden rounded-[1.75rem] bg-navy-900 shadow-lift sm:mt-12">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1080px) 64rem, 100vw"
              unoptimized={!canOptimizeImage(post.cover_url)}
              className="object-cover"
            />
          </div>
        )}

        <RichText content={post.body ?? ""} className="mx-auto mt-10 max-w-2xl sm:mt-14" />
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </ArticleShell>
  );
}
