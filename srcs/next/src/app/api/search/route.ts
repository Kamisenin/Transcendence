import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma/prisma"
import { getCurrentUser } from "@/app/lib/session"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")
  if (!query)
	return NextResponse.json({ error: "Missing query" }, { status: 400 })

  const user = await getCurrentUser()
  if (!user)
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = user.user_id
  const queryWords = query.split(" ").filter((w: string) => w.length > 2).join(" ")

  if (!queryWords)
	return NextResponse.json({ error: "Query too short" }, { status: 400 })

  const pages = await prisma.$queryRaw`
	SELECT DISTINCT p.page_id, p.title,
	 ps.namespace, ps.slug,
	 array_agg(t.name) as tags
	FROM pages p
	JOIN tag_pages tp ON tp.page_id = p.page_id
	JOIN tags t ON t.id = tp.tag_id
	JOIN page_slugs ps ON ps.page_id = p.page_id
		AND ps.is_canonical = true
	WHERE (
		p.public = true
		OR p.owner_id = ${userId}
		OR EXISTS (
			SELECT 1
			FROM page_permissions pp
			WHERE pp.page_id = p.page_id
			AND pp.user_token = ${userId}
		)
		OR EXISTS (
			SELECT 1
			FROM tag_members tm
			WHERE tm.tag_id = tp.tag_id
			AND tm.user_token = ${userId}
		)
	)
	AND similarity(t.name, ${queryWords}) > 0.15
	GROUP BY p.page_id, p.title, ps.namespace, ps.slug
  `

  const items = (pages as any[]).map(page => ({
	id: page.page_id,
	title: page.title,
	tags: page.tags,
	namespace: page.namespace,
	slug: page.slug
  }))

  console.log("SEARCH QUERY:", query)
  console.log("SEARCH USER:", userId)
  console.log("SEARCH QUERY WORDS:", queryWords)
  console.log("SEARCH PAGES:", pages)
  console.log("SEARCH ITEMS:", items)
  let response
  try {
	response = await fetch(`${process.env.SEARCH_ENGINE_URL || "http://search-engine:8000"}/search`, {
	 method: "POST",
	 headers: { "Content-Type": "application/json" },
	 body: JSON.stringify({ query, items })
	})
  } catch (err) {
	return NextResponse.json({ error: "Search service unavailable" }, { status: 503 })
  }

  if (!response.ok)
	return NextResponse.json({ error: "Search service error" }, { status: 502 })

  return NextResponse.json(await response.json())
}
