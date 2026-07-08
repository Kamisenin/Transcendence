import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
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

  const pages = await prisma.$queryRaw`
	SELECT DISTINCT p.page_id, p.title,
	  array_agg(t.name) as tags
	FROM pages p
	JOIN tag_pages tp ON tp.page_id = p.page_id
	JOIN tags t ON t.id = tp.tag_id
	WHERE (
	  EXISTS (SELECT 1 FROM page_permissions pp WHERE pp.page_id = p.page_id AND pp.user_token = ${userId})
	  OR EXISTS (SELECT 1 FROM tag_members tm WHERE tm.tag_id = tp.tag_id AND tm.user_token = ${userId})
	)
	AND similarity(t.name, ${queryWords}) > 0.15
	GROUP BY p.page_id, p.title
  `

  const items = (pages as any[]).map(page => ({
	id: page.page_id,
	title: page.title,
	tags: page.tags
  }))

  const response = await fetch("http://search-engine:8000/search", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ query, items })
  })

  return NextResponse.json(await response.json())
}